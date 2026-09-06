import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, InputHTMLAttributes } from 'react';
import { verifyPackageFiles } from '@peaceos/core/verify';
import type { FileTree } from '@peaceos/core/file-tree';
import type { CheckResult, VerifyReport } from '@peaceos/core';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { formatCustomRegistryStatus, formatEmbeddedRegistryStatus, getCheckCopy, getStatusDescription, getStatusLabel, getVerdictCopy } from './copy.js';
import { buildEmbeddedTransparencyTree, embeddedRegistryVersion, resolveTransparencyTree } from './embeddedTransparency.js';
import {
  buildFileTreeFromFiles,
  collectDroppedDirectoryFiles,
  type BrowserDirectoryFile,
} from './fileTree.js';
import { getTranslation, isLanguage, type Language } from './i18n.js';
import { LanguageSelector } from './languageSelector.js';
import { withNetworkBlocked } from './networkGuard.js';

const LOGO_SRC = '/images/Verify_POS_logo.png';
const LANGUAGE_STORAGE_KEY = 'peaceos.verify.language';

type DirectoryKind = 'package' | 'transparency';
type StatusTone = 'success' | 'error' | 'warning' | 'info';
type AppError = { type: 'local'; key: 'selectEvidenceFirst' } | { type: 'raw'; message: string } | null;

interface DirectoryPickerProps {
  title: string;
  description: string;
  buttonLabel: string;
  selectAriaPrefix: string;
  language: Language;
  tree: FileTree | null;
  onFiles: (files: BrowserDirectoryFile[]) => Promise<void>;
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'es';
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(storedLanguage) ? storedLanguage : 'es';
}

function getDocumentLanguage(language: Language): string {
  if (language === 'zh') return 'zh-CN';
  return language;
}

function fileCountLabel(tree: FileTree | null, language: Language) {
  const t = getTranslation(language);

  if (!tree) return t.noSelection;
  if (language === 'zh') return `${tree.size}${t.loadedPlural}`;
  return `${tree.size} ${tree.size === 1 ? t.loadedSingular : t.loadedPlural}`;
}

function statusTone(check: CheckResult): StatusTone {
  if (check.id === 'timestamp' && check.status === 'ok') return 'info';
  if (check.status === 'ok') return 'success';
  if (check.status === 'fail') return 'error';
  return 'warning';
}

function statusIcon(check: CheckResult) {
  if (check.status === 'ok') return <CheckCircleOutlineIcon fontSize="small" />;
  if (check.status === 'fail') return <ErrorOutlineIcon fontSize="small" />;
  return <HelpOutlineIcon fontSize="small" />;
}

function resolveErrorMessage(error: AppError, language: Language) {
  if (!error) return null;
  if (error.type === 'raw') return error.message;
  return getTranslation(language)[error.key];
}

function DirectoryPicker({
  title,
  description,
  buttonLabel,
  selectAriaPrefix,
  language,
  tree,
  onFiles,
}: DirectoryPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const directoryInputProps = {
    webkitdirectory: '',
    directory: '',
  } as InputHTMLAttributes<HTMLInputElement> & { webkitdirectory: string; directory: string };

  async function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    await onFiles(files);
    input.value = '';
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    await onFiles(await collectDroppedDirectoryFiles(event.dataTransfer));
  }

  return (
    <Box
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      sx={(theme) => ({
        py: 1.15,
        borderBottom: 1,
        borderColor: 'divider',
        '&:focus-within': {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      })}
    >
      <Stack spacing={0.9}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={(theme) => ({
              width: 26,
              height: 26,
              borderRadius: 1,
              display: 'grid',
              flex: '0 0 auto',
              placeItems: 'center',
              color: tree ? 'success.main' : 'primary.main',
              bgcolor: alpha(tree ? theme.palette.success.main : theme.palette.primary.main, 0.1),
            })}
          >
            {tree ? <CheckCircleOutlineIcon fontSize="small" /> : <FolderOutlinedIcon fontSize="small" />}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">{title}</Typography>
              <Typography
                variant="caption"
                color={tree ? 'success.main' : 'text.secondary'}
                sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}
              >
                {fileCountLabel(tree, language)}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Stack>

        <input
          {...directoryInputProps}
          ref={inputRef}
          hidden
          aria-label={`${selectAriaPrefix} ${title}`}
          type="file"
          multiple
          onChange={handleInputChange}
        />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => inputRef.current?.click()}
          sx={{ justifyContent: 'flex-start' }}
        >
          {buttonLabel}
        </Button>
      </Stack>
    </Box>
  );
}

function TransparencySection({
  transparencyTree,
  transparencyPickerOpen,
  language,
  onLoadDirectory,
  onTogglePicker,
  onUseEmbeddedInstead,
}: {
  transparencyTree: FileTree | null;
  transparencyPickerOpen: boolean;
  language: Language;
  onLoadDirectory: (files: BrowserDirectoryFile[]) => Promise<void>;
  onTogglePicker: () => void;
  onUseEmbeddedInstead: () => void;
}) {
  const t = getTranslation(language);
  const showPicker = transparencyPickerOpen || Boolean(transparencyTree);

  return (
    <Box sx={{ py: 1.15, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <ShieldOutlinedIcon fontSize="small" color={transparencyTree ? 'success' : 'action'} />
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {transparencyTree
            ? formatCustomRegistryStatus(transparencyTree.size, language)
            : formatEmbeddedRegistryStatus(embeddedRegistryVersion, language)}
        </Typography>
      </Stack>
      <Button size="small" sx={{ mt: 0.25, px: 0, minWidth: 0 }} onClick={transparencyTree ? onUseEmbeddedInstead : onTogglePicker}>
        {transparencyTree
          ? t.transparencyUseEmbeddedInstead
          : transparencyPickerOpen
            ? t.transparencyAdvancedToggleHide
            : t.transparencyAdvancedToggleShow}
      </Button>

      <Collapse in={showPicker} timeout="auto" unmountOnExit>
        <Box sx={{ pt: 1 }}>
          <DirectoryPicker
            title={t.transparencyTitle}
            description={t.transparencyDescription}
            buttonLabel={t.selectFolder}
            selectAriaPrefix={t.selectFolderAriaPrefix}
            language={language}
            tree={transparencyTree}
            onFiles={onLoadDirectory}
          />
          {transparencyTree && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
              {t.transparencyOverridesNote}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

function InputRail({
  packageTree,
  transparencyTree,
  transparencyPickerOpen,
  loading,
  language,
  onLoadDirectory,
  onToggleTransparencyPicker,
  onUseEmbeddedInstead,
  onVerify,
}: {
  packageTree: FileTree | null;
  transparencyTree: FileTree | null;
  transparencyPickerOpen: boolean;
  loading: boolean;
  language: Language;
  onLoadDirectory: (kind: DirectoryKind, files: BrowserDirectoryFile[]) => Promise<void>;
  onToggleTransparencyPicker: () => void;
  onUseEmbeddedInstead: () => void;
  onVerify: () => Promise<void>;
}) {
  const t = getTranslation(language);

  return (
    <Box
      component="aside"
      sx={{
        gridArea: 'input',
        p: 1.5,
        borderRight: { lg: 1 },
        borderBottom: { xs: 1, lg: 0 },
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1.25}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {t.inputLocal}
          </Typography>
          <Typography variant="h2">{t.requiredFiles}</Typography>
        </Box>

        <DirectoryPicker
          title={t.packageTitle}
          description={t.packageDescription}
          buttonLabel={t.selectFolder}
          selectAriaPrefix={t.selectFolderAriaPrefix}
          language={language}
          tree={packageTree}
          onFiles={(files) => onLoadDirectory('package', files)}
        />

        <TransparencySection
          transparencyTree={transparencyTree}
          transparencyPickerOpen={transparencyPickerOpen}
          language={language}
          onLoadDirectory={(files) => onLoadDirectory('transparency', files)}
          onTogglePicker={onToggleTransparencyPicker}
          onUseEmbeddedInstead={onUseEmbeddedInstead}
        />

        <Button
          fullWidth
          size="small"
          variant="contained"
          startIcon={<ShieldOutlinedIcon />}
          onClick={onVerify}
          disabled={loading || !packageTree}
        >
          {t.verifyEvidence}
        </Button>
      </Stack>
    </Box>
  );
}

function TrustLine({ language }: { language: Language }) {
  const t = getTranslation(language);

  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pt: 1 }}>
      {t.verifiedInBrowser}
    </Typography>
  );
}

function InitialState({ language }: { language: Language }) {
  const t = getTranslation(language);

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          {t.result}
        </Typography>
        <Typography variant="h1">{t.initialTitle}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
          {t.initialText}
        </Typography>
      </Stack>
    </Box>
  );
}

function LoadingState({ language }: { language: Language }) {
  const t = getTranslation(language);

  return (
    <Box sx={{ p: 2 }}>
      <LinearProgress sx={{ mb: 1.5 }} />
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          {t.verifying}
        </Typography>
        <Typography variant="h1">{t.processingTree}</Typography>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
          <Stack key={row} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Skeleton variant="rounded" width={108} height={22} />
            <Skeleton variant="text" width={`${58 - row * 3}%`} />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function VerdictBand({
  report,
  packageId,
  copied,
  language,
  onCopy,
}: {
  report: VerifyReport;
  packageId: string;
  copied: boolean;
  language: Language;
  onCopy: () => Promise<void>;
}) {
  const t = getTranslation(language);
  const verdict = getVerdictCopy(report, language);

  return (
    <Box
      sx={(theme) => ({
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: alpha(theme.palette[verdict.tone].main, 0.08),
      })}
    >
      <Stack spacing={1}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              sx={(theme) => ({
                width: 32,
                height: 32,
                borderRadius: 1,
                display: 'grid',
                placeItems: 'center',
                color: `${verdict.tone}.main`,
                bgcolor: alpha(theme.palette[verdict.tone].main, 0.13),
              })}
            >
              {report.verdict === 'authentic' ? <VerifiedOutlinedIcon fontSize="small" /> : <ReportProblemOutlinedIcon fontSize="small" />}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t.verdict}
              </Typography>
              <Typography variant="h1" color={`${verdict.tone}.main`}>
                {verdict.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {verdict.text}
              </Typography>
            </Box>
          </Stack>
          <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={onCopy}>
            {copied ? t.copied : t.copyFingerprint}
          </Button>
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {t.packageFingerprint}
          </Typography>
          <Typography
            component="p"
            sx={(theme) => ({
              m: 0,
              fontFamily: theme.custom.monoFontFamily,
              fontSize: '0.76rem',
              overflowWrap: 'anywhere',
            })}
          >
            {packageId}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ChecksTable({ checks, language }: { checks: CheckResult[]; language: Language }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const t = getTranslation(language);

  return (
    <Table size="small" aria-label={t.tableAriaLabel}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 172 }}>{t.status}</TableCell>
          <TableCell sx={{ width: 210 }}>{t.check}</TableCell>
          <TableCell>{t.message}</TableCell>
          <TableCell align="right" sx={{ width: 48 }}>
            {t.technicalDetail}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {checks.map((check) => {
          const tone = statusTone(check);
          const isExpanded = Boolean(expanded[check.id]);
          const copy = getCheckCopy(check, language);

          return (
            <Fragment key={check.id}>
              <TableRow hover>
                <TableCell>
                  <Stack spacing={0.25} sx={{ alignItems: 'flex-start' }}>
                    <Chip
                      icon={statusIcon(check)}
                      label={getStatusLabel(check, language)}
                      color={tone}
                      variant={check.status === 'ok' ? 'filled' : 'outlined'}
                      sx={{ height: 22, '& .MuiChip-label': { px: 0.75 } }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {getStatusDescription(check, language)}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1">{copy.name}</Typography>
                  {check.id === 'timestamp' && (
                    <Typography variant="caption" color="info.main" sx={{ fontWeight: 500 }}>
                      {t.pendingConfirmation}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Stack spacing={0.35}>
                    <Typography variant="body2" color="text.primary" sx={{ overflowWrap: 'anywhere' }}>
                      {copy.result}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {copy.what}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {t.whyItMatters}: {copy.why}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={isExpanded ? t.hideTechnicalDetail : t.showTechnicalDetail}>
                    <IconButton
                      size="small"
                      aria-label={`${isExpanded ? t.hideTechnicalDetail : t.showTechnicalDetail}: ${copy.name}`}
                      onClick={() => setExpanded((current) => ({ ...current, [check.id]: !isExpanded }))}
                    >
                      {isExpanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} sx={{ p: 0, borderBottom: isExpanded ? 1 : 0 }}>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 2, py: 1, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {t.technicalDetail}
                      </Typography>
                      <Typography
                        component="pre"
                        sx={(theme) => ({
                          m: 0,
                          mt: 0.5,
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'anywhere',
                          fontFamily: theme.custom.monoFontFamily,
                          fontSize: '0.74rem',
                        })}
                      >
                        {check.message}
                      </Typography>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ReportView({ report, language }: { report: VerifyReport; language: Language }) {
  const [copied, setCopied] = useState(false);
  const t = getTranslation(language);
  const packageId = report.packageId ?? t.unknownPackageId;

  async function copyPackageId() {
    await navigator.clipboard.writeText(packageId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <Box>
      <VerdictBand report={report} packageId={packageId} copied={copied} language={language} onCopy={copyPackageId} />

      <Box sx={{ px: 1.5, py: 1 }}>
        <Alert severity="info" icon={<CloudOffOutlinedIcon />} sx={{ py: 0.35 }}>
          {t.timestampAlert}
        </Alert>
      </Box>

      <Divider />

      <Box sx={{ overflowX: 'auto' }}>
        <ChecksTable checks={report.checks} language={language} />
      </Box>

      <Box sx={{ px: 1.5, pb: 1 }}>
        <TrustLine language={language} />
      </Box>
    </Box>
  );
}

export function App() {
  const [packageTree, setPackageTree] = useState<FileTree | null>(null);
  const [transparencyTree, setTransparencyTree] = useState<FileTree | null>(null);
  const [transparencyPickerOpen, setTransparencyPickerOpen] = useState(false);
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [error, setError] = useState<AppError>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const t = getTranslation(language);
  const embeddedTransparencyTree = useMemo(() => buildEmbeddedTransparencyTree(), []);

  useEffect(() => {
    document.documentElement.lang = getDocumentLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  async function loadDirectory(kind: DirectoryKind, files: BrowserDirectoryFile[]) {
    setError(null);
    setReport(null);

    try {
      const tree = await buildFileTreeFromFiles(files);
      if (kind === 'package') setPackageTree(tree);
      else setTransparencyTree(tree);
    } catch (err) {
      setError({ type: 'raw', message: (err as Error).message });
    }
  }

  function toggleTransparencyPicker() {
    setTransparencyPickerOpen((open) => !open);
  }

  function useEmbeddedRegistryInstead() {
    setTransparencyTree(null);
    setTransparencyPickerOpen(false);
    setReport(null);
  }

  async function verifyInBrowser() {
    if (!packageTree) {
      setError({ type: 'local', key: 'selectEvidenceFirst' });
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const { result } = await withNetworkBlocked(() =>
        verifyPackageFiles(packageTree, {
          packagePath: '(browser-selected .vep directory)',
          transparencyFiles: resolveTransparencyTree(transparencyTree, embeddedTransparencyTree),
        }),
      );
      setReport(result);
    } catch (err) {
      setError({ type: 'raw', message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: { lg: '100vh' },
        overflow: { lg: 'hidden' },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar position="static" sx={{ flex: '0 0 auto' }}>
        <Toolbar variant="dense" sx={{ minHeight: 48, gap: 1.25 }}>
          <Box component="img" src={LOGO_SRC} alt="PeaceOS" sx={{ width: 30, height: 30, objectFit: 'contain' }} />
          <Typography variant="subtitle1" sx={{ color: 'common.white', flex: 1, minWidth: 0 }}>
            {t.appTitle}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.76)', whiteSpace: 'nowrap' }}>
            {t.localOffline}
          </Typography>
          <LanguageSelector language={language} onChange={setLanguage} />
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          py: { xs: 1.5, lg: 1.25 },
          flex: { lg: '1 1 auto' },
          minHeight: { lg: 0 },
          overflow: { lg: 'hidden' },
        }}
      >
        <Container maxWidth="xl" sx={{ height: { lg: '100%' }, display: { lg: 'flex' }, minHeight: 0 }}>
          <Paper
            variant="outlined"
            sx={{
              overflow: 'hidden',
              height: { lg: '100%' },
              minHeight: 0,
              width: '100%',
              boxShadow: 'none',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateAreas: {
                  xs: '"input" "results"',
                  lg: '"input results"',
                },
                gridTemplateColumns: { xs: '1fr', lg: '308px minmax(0, 1fr)' },
                height: { lg: '100%' },
                minHeight: 0,
              }}
            >
              <InputRail
                packageTree={packageTree}
                transparencyTree={transparencyTree}
                transparencyPickerOpen={transparencyPickerOpen}
                loading={loading}
                language={language}
                onLoadDirectory={loadDirectory}
                onToggleTransparencyPicker={toggleTransparencyPicker}
                onUseEmbeddedInstead={useEmbeddedRegistryInstead}
                onVerify={verifyInBrowser}
              />

              <Box
                component="section"
                aria-label={t.reportAriaLabel}
                sx={{
                  gridArea: 'results',
                  minWidth: 0,
                  minHeight: 0,
                  height: { lg: '100%' },
                  overflowY: { lg: 'auto' },
                  overflowX: 'hidden',
                }}
              >
                {error && (
                  <Box sx={{ p: 1.5, pb: 0 }}>
                    <Alert severity="error">{resolveErrorMessage(error, language)}</Alert>
                  </Box>
                )}
                {loading ? (
                  <LoadingState language={language} />
                ) : report ? (
                  <ReportView report={report} language={language} />
                ) : (
                  <InitialState language={language} />
                )}
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
