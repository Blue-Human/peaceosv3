export declare const REGISTRY_ROOT: string;
export declare const OUTPUT_PATH: string;

export interface RegistryKeyFile {
  ref: string;
  bytes: Buffer;
}

export interface RegistryVersion {
  commit: string;
  date: string;
}

export declare function collectRegistryKeyFiles(registryRoot: string): Promise<RegistryKeyFile[]>;
export declare function readRegistryVersion(registryRoot: string): RegistryVersion;
export declare function generateEmbeddedRegistryModule(version: RegistryVersion, files: RegistryKeyFile[]): string;
