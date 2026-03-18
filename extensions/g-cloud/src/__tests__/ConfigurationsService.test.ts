import { exec } from "child_process";
import { executeGcloudCommand } from "../gcloud";
import {
  listConfigurations,
  activateConfiguration,
  deleteConfiguration,
  createConfiguration,
} from "../services/configurations/ConfigurationsService";
import type { GCloudConfig } from "../services/configurations/types";

// Mock executeGcloudCommand (used by listConfigurations)
jest.mock("../gcloud", () => ({
  executeGcloudCommand: jest.fn(),
}));

// Mock child_process.exec as a proper callback-based function so that
// util.promisify(exec) works naturally. Default: success with empty output.
jest.mock("child_process", () => ({
  exec: jest.fn((_cmd: string, cb: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
    cb(null, { stdout: "", stderr: "" });
  }),
}));

const mockExecuteGcloudCommand = executeGcloudCommand as jest.MockedFunction<typeof executeGcloudCommand>;
const mockExec = exec as unknown as jest.Mock;

describe("ConfigurationsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset exec to default success behavior
    mockExec.mockImplementation(
      (_cmd: string, cb: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: "", stderr: "" });
      },
    );
  });

  // ─── listConfigurations ──────────────────────────────────────────

  describe("listConfigurations", () => {
    it("calls executeGcloudCommand with correct args and skipCache", async () => {
      const mockConfigs: GCloudConfig[] = [
        {
          name: "default",
          is_active: true,
          properties: {
            core: { project: "my-project", account: "user@example.com" },
            compute: { region: "us-central1" },
          },
        },
        {
          name: "dev",
          is_active: false,
          properties: {
            core: { project: "dev-project", account: "dev@example.com" },
            compute: { region: "us-east1" },
          },
        },
      ];

      mockExecuteGcloudCommand.mockResolvedValue(mockConfigs);

      const result = await listConfigurations("/usr/bin/gcloud");

      expect(mockExecuteGcloudCommand).toHaveBeenCalledWith(
        "/usr/bin/gcloud",
        "config configurations list",
        undefined,
        { skipCache: true },
      );
      expect(result).toEqual(mockConfigs);
      expect(result).toHaveLength(2);
    });

    it("returns empty array when no configurations exist", async () => {
      mockExecuteGcloudCommand.mockResolvedValue([]);

      const result = await listConfigurations("/usr/bin/gcloud");

      expect(result).toEqual([]);
    });

    it("propagates errors from executeGcloudCommand", async () => {
      mockExecuteGcloudCommand.mockRejectedValue(new Error("gcloud not found"));

      await expect(listConfigurations("/usr/bin/gcloud")).rejects.toThrow("gcloud not found");
    });
  });

  // ─── activateConfiguration ──────────────────────────────────────

  describe("activateConfiguration", () => {
    it("runs the correct activate command", async () => {
      await activateConfiguration("/usr/bin/gcloud", "dev-config");

      expect(mockExec).toHaveBeenCalledWith(
        "/usr/bin/gcloud config configurations activate dev-config",
        expect.any(Function),
      );
    });

    it("quotes path with spaces", async () => {
      await activateConfiguration("/path with spaces/gcloud", "my-config");

      expect(mockExec).toHaveBeenCalledWith(
        '"/path with spaces/gcloud" config configurations activate my-config',
        expect.any(Function),
      );
    });

    it("propagates errors", async () => {
      mockExec.mockImplementation((_cmd: string, cb: Function) => {
        cb(new Error("Configuration does not exist"), null);
      });

      await expect(activateConfiguration("/usr/bin/gcloud", "invalid")).rejects.toThrow(
        "Configuration does not exist",
      );
    });
  });

  // ─── deleteConfiguration ────────────────────────────────────────

  describe("deleteConfiguration", () => {
    it("runs the correct delete command with --quiet", async () => {
      await deleteConfiguration("/usr/bin/gcloud", "old-config");

      expect(mockExec).toHaveBeenCalledWith(
        "/usr/bin/gcloud config configurations delete old-config --quiet",
        expect.any(Function),
      );
    });

    it("quotes path with spaces", async () => {
      await deleteConfiguration("/path with spaces/gcloud", "old-config");

      expect(mockExec).toHaveBeenCalledWith(
        '"/path with spaces/gcloud" config configurations delete old-config --quiet',
        expect.any(Function),
      );
    });

    it("propagates errors", async () => {
      mockExec.mockImplementation((_cmd: string, cb: Function) => {
        cb(new Error("Cannot delete active configuration"), null);
      });

      await expect(deleteConfiguration("/usr/bin/gcloud", "active")).rejects.toThrow(
        "Cannot delete active configuration",
      );
    });
  });

  // ─── createConfiguration ────────────────────────────────────────

  describe("createConfiguration", () => {
    it("creates config with all properties (project, account, region)", async () => {
      await createConfiguration("/usr/bin/gcloud", "test-config", {
        project: "my-project",
        account: "user@example.com",
        region: "us-central1",
      });

      expect(mockExec).toHaveBeenCalledTimes(4);
      expect(mockExec).toHaveBeenNthCalledWith(
        1,
        "/usr/bin/gcloud config configurations create test-config",
        expect.any(Function),
      );
      expect(mockExec).toHaveBeenNthCalledWith(
        2,
        "/usr/bin/gcloud config set project my-project --configuration=test-config",
        expect.any(Function),
      );
      expect(mockExec).toHaveBeenNthCalledWith(
        3,
        "/usr/bin/gcloud config set account user@example.com --configuration=test-config",
        expect.any(Function),
      );
      expect(mockExec).toHaveBeenNthCalledWith(
        4,
        "/usr/bin/gcloud config set compute/region us-central1 --configuration=test-config",
        expect.any(Function),
      );
    });

    it("creates config with only name (no optional properties)", async () => {
      await createConfiguration("/usr/bin/gcloud", "minimal-config", {});

      expect(mockExec).toHaveBeenCalledTimes(1);
      expect(mockExec).toHaveBeenCalledWith(
        "/usr/bin/gcloud config configurations create minimal-config",
        expect.any(Function),
      );
    });

    it("creates config with partial properties (project + region only)", async () => {
      await createConfiguration("/usr/bin/gcloud", "partial-config", {
        project: "my-project",
        region: "us-west1",
      });

      expect(mockExec).toHaveBeenCalledTimes(3);
      expect(mockExec).toHaveBeenNthCalledWith(
        1,
        "/usr/bin/gcloud config configurations create partial-config",
        expect.any(Function),
      );
      expect(mockExec).toHaveBeenNthCalledWith(
        2,
        "/usr/bin/gcloud config set project my-project --configuration=partial-config",
        expect.any(Function),
      );
      expect(mockExec).toHaveBeenNthCalledWith(
        3,
        "/usr/bin/gcloud config set compute/region us-west1 --configuration=partial-config",
        expect.any(Function),
      );
    });

    it("quotes path with spaces for all commands", async () => {
      await createConfiguration("/path with spaces/gcloud", "test", {
        project: "proj",
      });

      expect(mockExec).toHaveBeenNthCalledWith(
        1,
        '"/path with spaces/gcloud" config configurations create test',
        expect.any(Function),
      );
      expect(mockExec).toHaveBeenNthCalledWith(
        2,
        '"/path with spaces/gcloud" config set project proj --configuration=test',
        expect.any(Function),
      );
    });

    it("propagates errors during creation", async () => {
      mockExec.mockImplementation((_cmd: string, cb: Function) => {
        cb(new Error("Configuration already exists"), null);
      });

      await expect(
        createConfiguration("/usr/bin/gcloud", "existing", {
          project: "proj",
        }),
      ).rejects.toThrow("Configuration already exists");
    });

    it("propagates errors during property setting", async () => {
      let callCount = 0;
      mockExec.mockImplementation((_cmd: string, cb: Function) => {
        callCount++;
        if (callCount === 1) {
          cb(null, { stdout: "", stderr: "" }); // create succeeds
        } else {
          cb(new Error("Invalid project"), null); // set project fails
        }
      });

      await expect(
        createConfiguration("/usr/bin/gcloud", "bad-config", {
          project: "invalid!project",
        }),
      ).rejects.toThrow("Invalid project");
    });
  });
});
