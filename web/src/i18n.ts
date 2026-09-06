import type { CheckId } from '@peaceos/core';

export type Language = 'es' | 'en' | 'fr' | 'zh';

export interface CheckCopyText {
  name: string;
  what: string;
  why: string;
  ok?: string;
  fail?: string;
  notDetermined?: string;
  emptyOk?: string;
}

export interface Translation {
  languageLabel: string;
  languageSelectorAria: string;
  appTitle: string;
  localOffline: string;
  inputLocal: string;
  requiredFiles: string;
  packageTitle: string;
  packageDescription: string;
  transparencyTitle: string;
  transparencyDescription: string;
  transparencyAdvancedToggleShow: string;
  transparencyAdvancedToggleHide: string;
  transparencyOverridesNote: string;
  transparencyUseEmbeddedInstead: string;
  embeddedRegistryStatus: string;
  customRegistryStatus: string;
  updatedRegistryStatus: string;
  updateRegistryButton: string;
  updateRegistryButtonLoading: string;
  updateRegistrySuccess: string;
  registryStaleWarning: string;
  verifyEvidence: string;
  selectFolder: string;
  selectFolderAriaPrefix: string;
  noSelection: string;
  loadedSingular: string;
  loadedPlural: string;
  verifiedInBrowser: string;
  result: string;
  initialTitle: string;
  initialText: string;
  verifying: string;
  processingTree: string;
  verdict: string;
  copied: string;
  copyFingerprint: string;
  packageFingerprint: string;
  timestampAlert: string;
  tableAriaLabel: string;
  status: string;
  check: string;
  message: string;
  technicalDetail: string;
  whyItMatters: string;
  pendingConfirmation: string;
  showTechnicalDetail: string;
  hideTechnicalDetail: string;
  reportAriaLabel: string;
  selectEvidenceFirst: string;
  unknownPackageId: string;
  statusLabels: {
    ok: string;
    fail: string;
    notDetermined: string;
    unconfirmed: string;
  };
  statusDescriptions: {
    ok: string;
    fail: string;
    notDetermined: string;
    unconfirmed: string;
  };
  verdicts: {
    authenticTitle: string;
    authenticText: string;
    incompleteTitle: string;
    incompleteText: string;
    errorTitle: string;
    errorText: string;
  };
  checks: Record<CheckId, CheckCopyText>;
}

export const LANGUAGE_OPTIONS: Array<{
  value: Language;
  code: 'ES' | 'EN' | 'FR' | 'ZH';
  name: string;
  flag: 'es' | 'gb' | 'fr' | 'cn';
}> = [
  { value: 'es', code: 'ES', name: 'Español', flag: 'es' },
  { value: 'en', code: 'EN', name: 'English', flag: 'gb' },
  { value: 'fr', code: 'FR', name: 'Français', flag: 'fr' },
  { value: 'zh', code: 'ZH', name: '中文', flag: 'cn' },
];

const TRANSLATIONS: Record<Language, Translation> = {
  es: {
    languageLabel: 'Idioma',
    languageSelectorAria: 'Selector de idioma',
    appTitle: 'PeaceOS Verify',
    localOffline: 'Local · sin red',
    inputLocal: 'Entrada local',
    requiredFiles: 'Archivos necesarios',
    packageTitle: 'Evidencia a verificar (.vep)',
    packageDescription: 'La carpeta que contiene la evidencia y sus sellos.',
    transparencyTitle: 'Organizaciones de confianza',
    transparencyDescription:
      'Copia local del registro público para comprobar quién firma. Selecciona la carpeta completa.',
    transparencyAdvancedToggleShow: 'Opción avanzada: cargar mi propia copia del registro',
    transparencyAdvancedToggleHide: 'Ocultar opción avanzada',
    transparencyOverridesNote: 'Tu copia sustituye al registro incorporado en esta verificación.',
    transparencyUseEmbeddedInstead: 'Usar el registro por defecto en su lugar',
    embeddedRegistryStatus: 'Registro incorporado: foto del {date} (commit {commit})',
    customRegistryStatus: 'Usando tu copia cargada del registro ({count})',
    updatedRegistryStatus: 'Registro actualizado: foto del {date} (commit {commit})',
    updateRegistryButton: 'Actualizar organizaciones',
    updateRegistryButtonLoading: 'Actualizando…',
    updateRegistrySuccess: 'Registro actualizado a la versión del {date} (commit {commit}).',
    registryStaleWarning: 'El registro en uso tiene más de {weeks} semanas. Considera actualizarlo.',
    verifyEvidence: 'Verificar evidencia',
    selectFolder: 'Seleccionar carpeta',
    selectFolderAriaPrefix: 'Seleccionar',
    noSelection: 'Sin seleccionar',
    loadedSingular: 'archivo cargado',
    loadedPlural: 'archivos cargados',
    verifiedInBrowser: 'Verificado en tu propio navegador. Nada se sube a ningún servidor.',
    result: 'Resultado',
    initialTitle: 'Comprueba si una evidencia es auténtica',
    initialText:
      'Carga la carpeta de la evidencia (.vep). El portal ya lleva incorporado el registro público de organizaciones; si quieres máxima garantía, puedes aportar tu propia copia como opción avanzada. Todo se comprueba aquí mismo, en tu navegador; nada se sube a ningún sitio.',
    verifying: 'Verificando',
    processingTree: 'Procesando árbol en memoria',
    verdict: 'Veredicto',
    copied: 'Copiado',
    copyFingerprint: 'Copiar huella',
    packageFingerprint: 'Huella del paquete',
    timestampAlert:
      'Fecha y hora: hay una prueba ligada a este paquete. La confirmación definitiva en la red pública se comprueba aparte y aquí todavía no se ha confirmado.',
    tableAriaLabel: 'Comprobaciones de verificación',
    status: 'Estado',
    check: 'Comprobación',
    message: 'Mensaje',
    technicalDetail: 'Detalle técnico',
    whyItMatters: 'Por qué importa',
    pendingConfirmation: 'Sin confirmar',
    showTechnicalDetail: 'Ver detalle técnico',
    hideTechnicalDetail: 'Ocultar detalle técnico',
    reportAriaLabel: 'Resultados de verificación',
    selectEvidenceFirst: 'Selecciona primero la carpeta de evidencia.',
    unknownPackageId: '(desconocido: el manifiesto no superó la validación de esquema)',
    statusLabels: {
      ok: 'Correcto',
      fail: 'Problema',
      notDetermined: 'Sin comprobar',
      unconfirmed: 'Sin confirmar',
    },
    statusDescriptions: {
      ok: 'Comprobado correctamente',
      fail: 'Se comprobó y falló',
      notDetermined: 'No se pudo comprobar',
      unconfirmed: 'Fecha ligada al paquete, pendiente de confirmación pública',
    },
    verdicts: {
      authenticTitle: 'Evidencia auténtica',
      authenticText: 'Esta evidencia es genuina y no ha sido manipulada.',
      incompleteTitle: 'Verificación incompleta',
      incompleteText:
        'Falta información para terminar de comprobarlo. Esto no significa que la evidencia sea falsa: significa que aún no se ha podido comprobar del todo.',
      errorTitle: 'Se han detectado problemas',
      errorText: 'No podemos confirmar que esta evidencia sea auténtica. Revisa las comprobaciones marcadas en rojo.',
    },
    checks: {
      integrity: {
        name: 'Archivos íntegros',
        what: 'Comprueba que ningún archivo del paquete se ha modificado desde que se creó.',
        why: 'Si alguien hubiera cambiado una foto, un vídeo o un testimonio, esta comprobación lo detectaría.',
        ok: 'Todos los archivos están intactos.',
        fail: 'Al menos un archivo ha sido modificado.',
        notDetermined: 'No se pudo comprobar si los archivos están intactos.',
      },
      field_signature: {
        name: 'Firma de origen',
        what: 'Comprueba que el paquete lo firmó el dispositivo que documentó la evidencia y que esa firma es auténtica.',
        why: 'Garantiza que la evidencia viene de quien dice, sin que nadie haya podido suplantar su firma.',
        ok: 'La firma de origen es válida.',
        fail: 'La firma de origen no es válida o la clave no coincide.',
        notDetermined: 'No se pudo comprobar la firma de origen.',
      },
      org_countersignature: {
        name: 'Sello de la organización',
        what: 'Comprueba que la organización responsable ha respaldado el paquete con su propia firma.',
        why: 'Es la organización, con su reputación, la que avala esta evidencia.',
        ok: 'La organización ha sellado este paquete.',
        fail: 'No se pudo validar el sello de la organización.',
        notDetermined: 'No se puede comprobar sin la carpeta de organizaciones de confianza.',
      },
      org_identity: {
        name: 'Organización verificada',
        what: 'Comprueba que la organización que firma está en el registro público de confianza y es quien dice ser.',
        why: 'Confirma que detrás de la evidencia hay una organización identificable y verificable, no un anónimo.',
        ok: 'La organización está en el registro de confianza.',
        fail: 'La organización no aparece en el registro de confianza aportado.',
        notDetermined: 'Falta la carpeta de organizaciones de confianza para comprobarlo.',
      },
      timestamp: {
        name: 'Fecha y hora',
        what: 'Comprueba que existe una prueba de cuándo se creó el paquete, ligada a su contenido.',
        why: 'Impide fingir que algo se documentó antes o después de lo que realmente ocurrió.',
        ok: 'Hay una prueba de la fecha, ligada a este paquete. La confirmación definitiva en la red pública se comprueba aparte y aquí todavía no se ha confirmado.',
        fail: 'La prueba de fecha no corresponde a este paquete.',
        notDetermined: 'No se pudo comprobar la prueba de fecha.',
      },
      package_id: {
        name: 'Identificador correcto',
        what: 'Comprueba que el identificador del paquete corresponde exactamente a su contenido.',
        why: 'Un identificador que no cuadra sería señal de que el paquete se ha alterado o mezclado.',
        ok: 'El identificador corresponde al contenido.',
        fail: 'El identificador no corresponde al contenido.',
        notDetermined: 'No se pudo comprobar el identificador del paquete.',
      },
      custody: {
        name: 'Cadena de custodia',
        what: 'Comprueba que queda registrado quién manejó la evidencia y en qué orden, sin saltos.',
        why: 'Muestra el recorrido de la evidencia desde que se capturó, algo clave para que un tribunal la tome en serio.',
        ok: 'El recorrido está firmado, en orden y empieza en la captura.',
        fail: 'La cadena de custodia tiene un problema de orden, firma o inicio.',
        notDetermined: 'No se pudo comprobar la cadena de custodia.',
        emptyOk: 'Este paquete no incluye cadena de custodia.',
      },
      redactions: {
        name: 'Datos sensibles protegidos',
        what: 'Comprueba que los datos delicados están ocultos, pero comprometidos.',
        why: 'Permite proteger a las personas ahora y, aun así, demostrar esos datos ante un juez más adelante sin exponerlos aquí.',
        ok: 'Los datos sensibles están protegidos y siguen siendo demostrables.',
        fail: 'Un dato protegido no cuadra con su compromiso.',
        notDetermined: 'No se pudo comprobar la protección de datos sensibles.',
        emptyOk: 'Este paquete no oculta ningún dato.',
      },
    },
  },
  en: {
    languageLabel: 'Language',
    languageSelectorAria: 'Language selector',
    appTitle: 'PeaceOS Verify',
    localOffline: 'Local · offline',
    inputLocal: 'Local input',
    requiredFiles: 'Required files',
    packageTitle: 'Evidence to verify (.vep)',
    packageDescription: 'The folder containing the evidence and its seals.',
    transparencyTitle: 'Trusted organizations',
    transparencyDescription: 'Local copy of the public registry used to check who signs. Select the whole folder.',
    transparencyAdvancedToggleShow: 'Advanced option: load my own copy of the registry',
    transparencyAdvancedToggleHide: 'Hide advanced option',
    transparencyOverridesNote: 'Your copy overrides the embedded registry for this verification.',
    transparencyUseEmbeddedInstead: 'Use the default registry instead',
    embeddedRegistryStatus: 'Embedded registry: snapshot from {date} (commit {commit})',
    customRegistryStatus: 'Using your loaded copy of the registry ({count})',
    updatedRegistryStatus: 'Updated registry: snapshot from {date} (commit {commit})',
    updateRegistryButton: 'Update organizations',
    updateRegistryButtonLoading: 'Updating…',
    updateRegistrySuccess: 'Registry updated to the {date} version (commit {commit}).',
    registryStaleWarning: 'The registry in use is more than {weeks} weeks old. Consider updating it.',
    verifyEvidence: 'Verify evidence',
    selectFolder: 'Select folder',
    selectFolderAriaPrefix: 'Select',
    noSelection: 'Not selected',
    loadedSingular: 'file loaded',
    loadedPlural: 'files loaded',
    verifiedInBrowser: 'Verified in your browser. Nothing is uploaded to any server.',
    result: 'Result',
    initialTitle: 'Check whether evidence is authentic',
    initialText:
      'Load the evidence folder (.vep). The portal already ships with the public organizations registry built in; for maximum assurance, you can bring your own copy as an advanced option. Everything is verified right here in your browser; nothing is uploaded anywhere.',
    verifying: 'Verifying',
    processingTree: 'Processing tree in memory',
    verdict: 'Verdict',
    copied: 'Copied',
    copyFingerprint: 'Copy fingerprint',
    packageFingerprint: 'Package fingerprint',
    timestampAlert:
      'Date and time: there is a proof attached to this package. Final confirmation on the public network is checked separately and has not yet been confirmed here.',
    tableAriaLabel: 'Verification checks',
    status: 'Status',
    check: 'Check',
    message: 'Message',
    technicalDetail: 'Technical detail',
    whyItMatters: 'Why it matters',
    pendingConfirmation: 'Unconfirmed',
    showTechnicalDetail: 'Show technical detail',
    hideTechnicalDetail: 'Hide technical detail',
    reportAriaLabel: 'Verification results',
    selectEvidenceFirst: 'Select the evidence folder first.',
    unknownPackageId: '(unknown: the manifest did not pass schema validation)',
    statusLabels: {
      ok: 'Valid',
      fail: 'Problem',
      notDetermined: 'Unchecked',
      unconfirmed: 'Unconfirmed',
    },
    statusDescriptions: {
      ok: 'Checked successfully',
      fail: 'Checked and failed',
      notDetermined: 'Could not be checked',
      unconfirmed: 'Date tied to the package, pending public confirmation',
    },
    verdicts: {
      authenticTitle: 'Authentic evidence',
      authenticText: 'This evidence is genuine and has not been tampered with.',
      incompleteTitle: 'Incomplete verification',
      incompleteText:
        'Some information is still missing to finish verification. This does not mean the evidence is false: it means it could not yet be fully checked.',
      errorTitle: 'Problems detected',
      errorText: 'We cannot confirm that this evidence is authentic. Review the checks marked in red.',
    },
    checks: {
      integrity: {
        name: 'Files intact',
        what: 'Checks that no file in the package has changed since it was created.',
        why: 'If someone altered a photo, video, or testimony, this check would catch it.',
        ok: 'All files are intact.',
        fail: 'At least one file has been modified.',
        notDetermined: 'Could not verify whether the files are intact.',
      },
      field_signature: {
        name: 'Source signature',
        what: 'Checks that the package was signed by the device that documented the evidence and that the signature is authentic.',
        why: 'It guarantees that the evidence comes from who it claims, without signature impersonation.',
        ok: 'The source signature is valid.',
        fail: 'The source signature is invalid or the key does not match.',
        notDetermined: 'Could not verify the source signature.',
      },
      org_countersignature: {
        name: 'Organization seal',
        what: 'Checks that the responsible organization backed the package with its own signature.',
        why: 'The organization, with its reputation, is endorsing this evidence.',
        ok: 'The organization sealed this package.',
        fail: 'The organization seal could not be validated.',
        notDetermined: 'This cannot be checked without the trusted-organizations folder.',
      },
      org_identity: {
        name: 'Verified organization',
        what: 'Checks that the signing organization appears in the public trust registry and is who it claims to be.',
        why: 'It confirms that there is an identifiable, verifiable organization behind the evidence, not an anonymous party.',
        ok: 'The organization appears in the trust registry.',
        fail: 'The organization does not appear in the provided trust registry.',
        notDetermined: 'The trusted-organizations folder is missing for this check.',
      },
      timestamp: {
        name: 'Date and time',
        what: 'Checks that there is proof of when the package was created, tied to its content.',
        why: 'It prevents someone from pretending the evidence was documented earlier or later than it really was.',
        ok: 'There is date proof tied to this package. Final confirmation on the public network is checked separately and has not yet been confirmed here.',
        fail: 'The date proof does not match this package.',
        notDetermined: 'Could not verify the date proof.',
      },
      package_id: {
        name: 'Correct identifier',
        what: 'Checks that the package identifier matches its content exactly.',
        why: 'A mismatched identifier would suggest that the package was altered or mixed up.',
        ok: 'The identifier matches the content.',
        fail: 'The identifier does not match the content.',
        notDetermined: 'Could not verify the package identifier.',
      },
      custody: {
        name: 'Chain of custody',
        what: 'Checks that it is recorded who handled the evidence and in what order, without gaps.',
        why: 'It shows the path of the evidence from capture onward, which is key for a court to take it seriously.',
        ok: 'The trail is signed, ordered, and starts at capture.',
        fail: 'The chain of custody has an issue with order, signature, or starting point.',
        notDetermined: 'Could not verify the chain of custody.',
        emptyOk: 'This package does not include a chain of custody.',
      },
      redactions: {
        name: 'Sensitive data protected',
        what: 'Checks that sensitive data is hidden but still committed.',
        why: 'It protects people now while still allowing those data to be proven to a judge later without exposing them here.',
        ok: 'Sensitive data is protected and still provable.',
        fail: 'A protected value does not match its commitment.',
        notDetermined: 'Could not verify sensitive-data protection.',
        emptyOk: 'This package does not hide any data.',
      },
    },
  },
  fr: {
    languageLabel: 'Langue',
    languageSelectorAria: 'Sélecteur de langue',
    appTitle: 'PeaceOS Verify',
    localOffline: 'Local · hors ligne',
    inputLocal: 'Entrée locale',
    requiredFiles: 'Fichiers requis',
    packageTitle: 'Preuve à vérifier (.vep)',
    packageDescription: 'Le dossier qui contient la preuve et ses sceaux.',
    transparencyTitle: 'Organisations de confiance',
    transparencyDescription: 'Copie locale du registre public pour vérifier qui signe. Sélectionnez le dossier complet.',
    transparencyAdvancedToggleShow: 'Option avancée : charger ma propre copie du registre',
    transparencyAdvancedToggleHide: "Masquer l'option avancée",
    transparencyOverridesNote: 'Votre copie remplace le registre incorporé pour cette vérification.',
    transparencyUseEmbeddedInstead: 'Utiliser le registre par défaut à la place',
    embeddedRegistryStatus: 'Registre incorporé : instantané du {date} (commit {commit})',
    customRegistryStatus: 'Utilisation de votre copie chargée du registre ({count})',
    updatedRegistryStatus: 'Registre mis à jour : instantané du {date} (commit {commit})',
    updateRegistryButton: 'Mettre à jour les organisations',
    updateRegistryButtonLoading: 'Mise à jour…',
    updateRegistrySuccess: 'Registre mis à jour vers la version du {date} (commit {commit}).',
    registryStaleWarning: 'Le registre utilisé a plus de {weeks} semaines. Pensez à le mettre à jour.',
    verifyEvidence: 'Vérifier la preuve',
    selectFolder: 'Sélectionner un dossier',
    selectFolderAriaPrefix: 'Sélectionner',
    noSelection: 'Aucune sélection',
    loadedSingular: 'fichier chargé',
    loadedPlural: 'fichiers chargés',
    verifiedInBrowser: "Vérifié dans votre navigateur. Rien n'est envoyé à un serveur.",
    result: 'Résultat',
    initialTitle: "Vérifier si une preuve est authentique",
    initialText:
      "Chargez le dossier de la preuve (.vep). Le portail intègre déjà le registre public des organisations ; pour une garantie maximale, vous pouvez apporter votre propre copie en option avancée. Tout est vérifié ici même, dans votre navigateur ; rien n'est envoyé ailleurs.",
    verifying: 'Vérification',
    processingTree: "Traitement de l'arborescence en mémoire",
    verdict: 'Verdict',
    copied: 'Copié',
    copyFingerprint: "Copier l'empreinte",
    packageFingerprint: 'Empreinte du paquet',
    timestampAlert:
      "Date et heure : une preuve liée à ce paquet existe. La confirmation définitive sur le réseau public se vérifie séparément et n'a pas encore été confirmée ici.",
    tableAriaLabel: 'Contrôles de vérification',
    status: 'État',
    check: 'Contrôle',
    message: 'Message',
    technicalDetail: 'Détail technique',
    whyItMatters: 'Pourquoi c’est important',
    pendingConfirmation: 'Non confirmé',
    showTechnicalDetail: 'Afficher le détail technique',
    hideTechnicalDetail: 'Masquer le détail technique',
    reportAriaLabel: 'Résultats de vérification',
    selectEvidenceFirst: "Sélectionnez d'abord le dossier de preuve.",
    unknownPackageId: "(inconnu : le manifeste n'a pas passé la validation du schéma)",
    statusLabels: {
      ok: 'Valide',
      fail: 'Problème',
      notDetermined: 'Non vérifié',
      unconfirmed: 'Non confirmé',
    },
    statusDescriptions: {
      ok: 'Vérifié avec succès',
      fail: 'Vérifié puis rejeté',
      notDetermined: 'Impossible à vérifier',
      unconfirmed: 'Date liée au paquet, confirmation publique en attente',
    },
    verdicts: {
      authenticTitle: 'Preuve authentique',
      authenticText: "Cette preuve est authentique et n'a pas été manipulée.",
      incompleteTitle: 'Vérification incomplète',
      incompleteText:
        "Il manque encore des informations pour terminer la vérification. Cela ne veut pas dire que la preuve est fausse : cela veut dire qu'elle n'a pas encore pu être entièrement vérifiée.",
      errorTitle: 'Problèmes détectés',
      errorText: "Nous ne pouvons pas confirmer que cette preuve est authentique. Vérifiez les contrôles marqués en rouge.",
    },
    checks: {
      integrity: {
        name: 'Fichiers intacts',
        what: "Vérifie qu'aucun fichier du paquet n'a été modifié depuis sa création.",
        why: "Si quelqu'un avait modifié une photo, une vidéo ou un témoignage, ce contrôle le détecterait.",
        ok: 'Tous les fichiers sont intacts.',
        fail: 'Au moins un fichier a été modifié.',
        notDetermined: "Impossible de vérifier si les fichiers sont intacts.",
      },
      field_signature: {
        name: "Signature d'origine",
        what: "Vérifie que le paquet a été signé par l'appareil qui a documenté la preuve et que cette signature est authentique.",
        why: "Cela garantit que la preuve vient bien de la source annoncée, sans usurpation de signature.",
        ok: "La signature d'origine est valide.",
        fail: "La signature d'origine est invalide ou la clé ne correspond pas.",
        notDetermined: "Impossible de vérifier la signature d'origine.",
      },
      org_countersignature: {
        name: "Sceau de l'organisation",
        what: "Vérifie que l'organisation responsable a validé le paquet avec sa propre signature.",
        why: "C'est l'organisation, avec sa réputation, qui appuie cette preuve.",
        ok: "L'organisation a scellé ce paquet.",
        fail: "Le sceau de l'organisation n'a pas pu être validé.",
        notDetermined: "Ce contrôle est impossible sans le dossier des organisations de confiance.",
      },
      org_identity: {
        name: 'Organisation vérifiée',
        what: "Vérifie que l'organisation signataire figure dans le registre public de confiance et qu'elle est bien celle qu'elle prétend être.",
        why: "Cela confirme qu'une organisation identifiable et vérifiable se trouve derrière la preuve, et non un acteur anonyme.",
        ok: "L'organisation figure dans le registre de confiance.",
        fail: "L'organisation n'apparaît pas dans le registre de confiance fourni.",
        notDetermined: "Le dossier des organisations de confiance est requis pour ce contrôle.",
      },
      timestamp: {
        name: 'Date et heure',
        what: "Vérifie qu'il existe une preuve du moment où le paquet a été créé, liée à son contenu.",
        why: "Cela empêche de prétendre que la preuve a été documentée plus tôt ou plus tard que dans la réalité.",
        ok: "Une preuve de date liée à ce paquet existe. La confirmation définitive sur le réseau public se vérifie séparément et n'a pas encore été confirmée ici.",
        fail: 'La preuve de date ne correspond pas à ce paquet.',
        notDetermined: 'Impossible de vérifier la preuve de date.',
      },
      package_id: {
        name: 'Identifiant correct',
        what: "Vérifie que l'identifiant du paquet correspond exactement à son contenu.",
        why: "Un identifiant incohérent indiquerait que le paquet a été altéré ou mélangé.",
        ok: "L'identifiant correspond au contenu.",
        fail: "L'identifiant ne correspond pas au contenu.",
        notDetermined: "Impossible de vérifier l'identifiant du paquet.",
      },
      custody: {
        name: 'Chaîne de conservation',
        what: "Vérifie qu'il est enregistré qui a manipulé la preuve et dans quel ordre, sans rupture.",
        why: "Cela montre le parcours de la preuve depuis la capture, ce qui est essentiel pour qu'un tribunal la prenne au sérieux.",
        ok: 'Le parcours est signé, ordonné et commence à la capture.',
        fail: "La chaîne de conservation présente un problème d'ordre, de signature ou de point de départ.",
        notDetermined: 'Impossible de vérifier la chaîne de conservation.',
        emptyOk: "Ce paquet n'inclut pas de chaîne de conservation.",
      },
      redactions: {
        name: 'Données sensibles protégées',
        what: 'Vérifie que les données sensibles sont masquées tout en restant engagées cryptographiquement.',
        why: "Cela permet de protéger les personnes maintenant tout en pouvant démontrer ces données à un juge plus tard sans les exposer ici.",
        ok: 'Les données sensibles sont protégées et restent démontrables.',
        fail: 'Une donnée protégée ne correspond pas à son engagement.',
        notDetermined: 'Impossible de vérifier la protection des données sensibles.',
        emptyOk: 'Ce paquet ne masque aucune donnée.',
      },
    },
  },
  zh: {
    languageLabel: '语言',
    languageSelectorAria: '语言选择器',
    appTitle: 'PeaceOS Verify',
    localOffline: '本地 · 离线',
    inputLocal: '本地输入',
    requiredFiles: '所需文件',
    packageTitle: '待验证证据（.vep）',
    packageDescription: '包含证据及其签章的文件夹。',
    transparencyTitle: '可信组织',
    transparencyDescription: '用于核验签署方的公共注册表本地副本。请选择整个文件夹。',
    transparencyAdvancedToggleShow: '高级选项：加载我自己的注册表副本',
    transparencyAdvancedToggleHide: '隐藏高级选项',
    transparencyOverridesNote: '在本次验证中，你的副本将替代内置注册表。',
    transparencyUseEmbeddedInstead: '改用默认注册表',
    embeddedRegistryStatus: '内置注册表：{date} 快照（提交 {commit}）',
    customRegistryStatus: '正在使用你加载的注册表副本（{count}）',
    updatedRegistryStatus: '已更新注册表：{date} 快照（提交 {commit}）',
    updateRegistryButton: '更新组织注册表',
    updateRegistryButtonLoading: '正在更新…',
    updateRegistrySuccess: '注册表已更新到 {date} 版本（提交 {commit}）。',
    registryStaleWarning: '当前使用的注册表已超过 {weeks} 周未更新，建议更新。',
    verifyEvidence: '验证证据',
    selectFolder: '选择文件夹',
    selectFolderAriaPrefix: '选择',
    noSelection: '未选择',
    loadedSingular: '个文件已加载',
    loadedPlural: '个文件已加载',
    verifiedInBrowser: '在你的浏览器中完成验证。不会上传到任何服务器。',
    result: '结果',
    initialTitle: '检查证据是否真实',
    initialText:
      '加载证据文件夹（.vep）。本工具已内置公共组织注册表；如需最高保障，你也可以加载自己的副本作为高级选项。所有验证都在你的浏览器中完成；不会上传到任何地方。',
    verifying: '验证中',
    processingTree: '正在内存中处理目录树',
    verdict: '结论',
    copied: '已复制',
    copyFingerprint: '复制指纹',
    packageFingerprint: '包指纹',
    timestampAlert: '日期与时间：该包附带时间证明。公共网络上的最终确认需要单独检查，这里尚未确认。',
    tableAriaLabel: '验证检查项',
    status: '状态',
    check: '检查项',
    message: '消息',
    technicalDetail: '技术细节',
    whyItMatters: '重要性',
    pendingConfirmation: '待确认',
    showTechnicalDetail: '显示技术细节',
    hideTechnicalDetail: '隐藏技术细节',
    reportAriaLabel: '验证结果',
    selectEvidenceFirst: '请先选择证据文件夹。',
    unknownPackageId: '（未知：清单未通过模式校验）',
    statusLabels: {
      ok: '通过',
      fail: '问题',
      notDetermined: '未验证',
      unconfirmed: '待确认',
    },
    statusDescriptions: {
      ok: '验证通过',
      fail: '已检查但失败',
      notDetermined: '无法验证',
      unconfirmed: '日期已绑定到包，等待公共确认',
    },
    verdicts: {
      authenticTitle: '证据真实',
      authenticText: '该证据是真实的，且未被篡改。',
      incompleteTitle: '验证不完整',
      incompleteText: '完成验证仍缺少部分信息。这不代表证据是假的，只表示目前还无法完全核验。',
      errorTitle: '发现问题',
      errorText: '我们无法确认该证据真实。请检查标红的项目。',
    },
    checks: {
      integrity: {
        name: '文件完整',
        what: '检查包中的文件自创建以来是否未被修改。',
        why: '如果有人改动了照片、视频或证词，这项检查会发现。',
        ok: '所有文件都保持完整。',
        fail: '至少有一个文件已被修改。',
        notDetermined: '无法验证文件是否完整。',
      },
      field_signature: {
        name: '来源签名',
        what: '检查该包是否由记录证据的设备签署，以及签名是否真实。',
        why: '这可确保该证据确实来自声明的来源，且签名未被冒用。',
        ok: '来源签名有效。',
        fail: '来源签名无效，或密钥不匹配。',
        notDetermined: '无法验证来源签名。',
      },
      org_countersignature: {
        name: '组织签章',
        what: '检查负责组织是否用自己的签名对该包进行了背书。',
        why: '这意味着由该组织及其信誉来为这份证据担保。',
        ok: '该组织已为此包加盖签章。',
        fail: '无法验证组织签章。',
        notDetermined: '没有可信组织文件夹则无法完成此检查。',
      },
      org_identity: {
        name: '组织已核验',
        what: '检查签署组织是否在公共信任注册表中，并且身份属实。',
        why: '这可确认证据背后是可识别、可核验的组织，而不是匿名方。',
        ok: '该组织出现在信任注册表中。',
        fail: '提供的信任注册表中未找到该组织。',
        notDetermined: '此检查需要可信组织文件夹。',
      },
      timestamp: {
        name: '日期与时间',
        what: '检查是否存在与内容绑定的包创建时间证明。',
        why: '这可防止有人伪称证据是在更早或更晚的时间记录的。',
        ok: '存在与此包绑定的时间证明。公共网络上的最终确认需要单独检查，这里尚未确认。',
        fail: '时间证明与此包不匹配。',
        notDetermined: '无法验证时间证明。',
      },
      package_id: {
        name: '标识符正确',
        what: '检查包标识符是否与其内容完全一致。',
        why: '若标识符不匹配，可能意味着该包被篡改或混淆。',
        ok: '标识符与内容一致。',
        fail: '标识符与内容不一致。',
        notDetermined: '无法验证包标识符。',
      },
      custody: {
        name: '保管链',
        what: '检查证据由谁处理、按何顺序处理，且中间没有缺口。',
        why: '这展示了证据自采集以来的流转路径，对法庭采信非常关键。',
        ok: '流转记录已签名、顺序正确，并从采集开始。',
        fail: '保管链在顺序、签名或起点上存在问题。',
        notDetermined: '无法验证保管链。',
        emptyOk: '该包不包含保管链。',
      },
      redactions: {
        name: '敏感数据受保护',
        what: '检查敏感数据是否被隐藏，同时仍保持加密承诺。',
        why: '这可以在当下保护相关人员，同时在以后面对法官时仍可证明这些数据，而无需在此公开。',
        ok: '敏感数据已受保护，且仍可证明。',
        fail: '某个受保护值与其承诺不匹配。',
        notDetermined: '无法验证敏感数据保护。',
        emptyOk: '该包没有隐藏任何数据。',
      },
    },
  },
};

export function isLanguage(value: string | null | undefined): value is Language {
  return value === 'es' || value === 'en' || value === 'fr' || value === 'zh';
}

export function getTranslation(language: Language): Translation {
  return TRANSLATIONS[language];
}
