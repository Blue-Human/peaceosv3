import type { CheckResult, VerifyReport } from '@peaceos/core';

import type { RegistryUpdateOutcome, RegistryVersion } from './desktopRegistry.js';
import { STALE_THRESHOLD_DAYS } from './desktopRegistry.js';
import type { EmbeddedRegistryVersion } from './embeddedTransparency.js';
import type { Language } from './i18n.js';
import { getTranslation } from './i18n.js';

export function formatEmbeddedRegistryStatus(version: EmbeddedRegistryVersion, language: Language): string {
  const date = version.date.slice(0, 10);
  return getTranslation(language)
    .embeddedRegistryStatus.replace('{date}', date)
    .replace('{commit}', version.commit);
}

export function formatUpdatedRegistryStatus(version: RegistryVersion, language: Language): string {
  const date = version.date.slice(0, 10);
  return getTranslation(language)
    .updatedRegistryStatus.replace('{date}', date)
    .replace('{commit}', version.commit.slice(0, 7));
}

export function formatUpdateSuccess(outcome: RegistryUpdateOutcome, language: Language): string {
  const date = outcome.date.slice(0, 10);
  return getTranslation(language)
    .updateRegistrySuccess.replace('{date}', date)
    .replace('{commit}', outcome.commit.slice(0, 7));
}

export function formatStaleWarning(language: Language): string {
  const weeks = Math.round(STALE_THRESHOLD_DAYS / 7);
  return getTranslation(language).registryStaleWarning.replace('{weeks}', String(weeks));
}

export function formatCustomRegistryStatus(fileCount: number, language: Language): string {
  return getTranslation(language).customRegistryStatus.replace('{count}', String(fileCount));
}

export function getStatusLabel(check: CheckResult, language: Language): string {
  const { statusLabels } = getTranslation(language);
  if (check.id === 'timestamp' && check.status === 'ok') return statusLabels.unconfirmed;
  if (check.status === 'ok') return statusLabels.ok;
  if (check.status === 'fail') return statusLabels.fail;
  return statusLabels.notDetermined;
}

export function getStatusDescription(check: CheckResult, language: Language): string {
  const { statusDescriptions } = getTranslation(language);
  if (check.id === 'timestamp' && check.status === 'ok') return statusDescriptions.unconfirmed;
  if (check.status === 'ok') return statusDescriptions.ok;
  if (check.status === 'fail') return statusDescriptions.fail;
  return statusDescriptions.notDetermined;
}

export function getCheckCopy(check: CheckResult, language: Language) {
  const copy = getTranslation(language).checks[check.id];

  if (check.id === 'custody' && check.status === 'ok' && /no custody events present/i.test(check.message)) {
    return { ...copy, result: copy.emptyOk ?? copy.ok ?? '' };
  }

  if (check.id === 'redactions' && check.status === 'ok' && /no redactions present/i.test(check.message)) {
    return { ...copy, result: copy.emptyOk ?? copy.ok ?? '' };
  }

  if (check.status === 'ok') return { ...copy, result: copy.ok ?? 'OK' };
  if (check.status === 'fail') return { ...copy, result: copy.fail ?? 'Failed' };
  return { ...copy, result: copy.notDetermined ?? 'Not determined' };
}

export function getVerdictCopy(report: VerifyReport, language: Language) {
  const { verdicts } = getTranslation(language);

  if (report.verdict === 'authentic') {
    return {
      tone: 'success' as const,
      title: verdicts.authenticTitle,
      text: verdicts.authenticText,
    };
  }

  const hasFail = report.checks.some((check) => check.status === 'fail');
  if (!hasFail && report.checks.some((check) => check.status === 'not_determined')) {
    return {
      tone: 'warning' as const,
      title: verdicts.incompleteTitle,
      text: verdicts.incompleteText,
    };
  }

  return {
    tone: 'error' as const,
    title: verdicts.errorTitle,
    text: verdicts.errorText,
  };
}
