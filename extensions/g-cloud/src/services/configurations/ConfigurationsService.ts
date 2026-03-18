import { exec } from "child_process";
import { promisify } from "util";
import { executeGcloudCommand } from "../../gcloud";
import { GCloudConfig } from "./types";

const execPromise = promisify(exec);

function quotePath(path: string): string {
  return path.includes(" ") ? `"${path}"` : path;
}

export async function listConfigurations(gcloudPath: string): Promise<GCloudConfig[]> {
  const result = await executeGcloudCommand(gcloudPath, "config configurations list", undefined, {
    skipCache: true,
  });
  return result as GCloudConfig[];
}

export async function activateConfiguration(gcloudPath: string, name: string): Promise<void> {
  const quotedPath = quotePath(gcloudPath);
  await execPromise(`${quotedPath} config configurations activate ${name}`);
}

export async function deleteConfiguration(gcloudPath: string, name: string): Promise<void> {
  const quotedPath = quotePath(gcloudPath);
  await execPromise(`${quotedPath} config configurations delete ${name} --quiet`);
}

export async function createConfiguration(
  gcloudPath: string,
  name: string,
  options: { project?: string; account?: string; region?: string },
): Promise<void> {
  const quotedPath = quotePath(gcloudPath);
  await execPromise(`${quotedPath} config configurations create ${name}`);

  if (options.project) {
    await execPromise(
      `${quotedPath} config set project ${options.project} --configuration=${name}`,
    );
  }
  if (options.account) {
    await execPromise(
      `${quotedPath} config set account ${options.account} --configuration=${name}`,
    );
  }
  if (options.region) {
    await execPromise(
      `${quotedPath} config set compute/region ${options.region} --configuration=${name}`,
    );
  }
}
