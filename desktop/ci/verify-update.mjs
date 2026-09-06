// CI-only smoke driver (not shipped, not a project dependency): launches the
// COMPILED desktop binary with WebView2 remote debugging enabled, drives it
// with Playwright over CDP, and proves — against the real canonical registry
// — that clicking "Update organizations" in the actual app actually reaches
// the Rust command, updates the registry, and that the app still verifies
// evidence afterwards. This is the one piece the Rust `cargo test` suite
// cannot prove on its own: that Tauri's IPC/capability wiring lets the
// frontend button reach the backend command at all.
//
// Usage: node verify-update.mjs <path-to-exe> <path-to-valid.vep-dir>
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const [, , exeArg, validVepArg] = process.argv;
if (!exeArg || !validVepArg) {
  console.error('Usage: node verify-update.mjs <path-to-exe> <path-to-valid.vep-dir>');
  process.exit(1);
}
const exePath = resolve(exeArg);
const validVepDir = resolve(validVepArg);

const CDP_PORT = 9333;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCdp(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${url}/json/version`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error('CDP endpoint on the desktop app never became ready');
}

const child = spawn(exePath, [], {
  env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${CDP_PORT}` },
  stdio: 'inherit',
});

let exitCode = 0;
try {
  await waitForCdp(`http://localhost:${CDP_PORT}`);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? (await context.newPage());

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.waitForSelector('text=Comprueba si una evidencia es auténtica', { timeout: 20000 });
  console.log('Desktop app window loaded.');

  const beforeStatus = await page.locator('text=Registro incorporado').first().innerText();
  console.log('Registry status before update:', beforeStatus);

  const updateButton = page.getByRole('button', { name: 'Actualizar organizaciones' });
  await updateButton.waitFor({ timeout: 10000 });
  await updateButton.click();
  console.log('Clicked "Actualizar organizaciones" — waiting for the real network update...');

  await page.waitForSelector('text=/Registro actualizado a la versión|No se pudo actualizar/', { timeout: 30000 });
  const outcomeText = await page.locator('text=/Registro actualizado a la versión|No se pudo actualizar/').first().innerText();
  console.log('Update outcome:', outcomeText);
  if (!outcomeText.startsWith('Registro actualizado')) {
    throw new Error(`Registry update reported failure: ${outcomeText}`);
  }

  const afterStatus = await page.locator('text=Registro actualizado:').first().innerText();
  console.log('Registry status after update:', afterStatus);

  // The (now updated) registry tier must still resolve the real example
  // package as AUTHENTIC — proving the update didn't just report success but
  // actually produced a usable transparency tree.
  await page.locator('input[type=file]').first().setInputFiles(validVepDir);
  await page.waitForSelector('text=/\\d+ archivos? cargados?/', { timeout: 10000 });
  await page.getByRole('button', { name: 'Verificar evidencia' }).click();
  await page.waitForSelector('text=/Evidencia auténtica|Verificación incompleta|Se han detectado problemas/', { timeout: 15000 });
  const verdict = await page
    .locator('text=/Evidencia auténtica|Verificación incompleta|Se han detectado problemas/')
    .first()
    .innerText();
  console.log('Verdict after update:', verdict);
  if (verdict !== 'Evidencia auténtica') {
    throw new Error(`Expected AUTHENTIC after updating the registry, got: ${verdict}`);
  }

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors during the run: ${JSON.stringify(consoleErrors)}`);
  }

  console.log('OK: "Update organizations" verified end-to-end in the compiled app against the real canonical registry.');
  await browser.close();
} catch (err) {
  console.error('SMOKE TEST FAILED:', err);
  exitCode = 1;
} finally {
  child.kill();
}
process.exit(exitCode);
