import { ActionPanel, Action, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { GCloudConfig } from "../types";
import { createConfiguration } from "../ConfigurationsService";

interface Props {
  gcloudPath: string;
  configs: GCloudConfig[];
  onCreated: () => void;
}

export function DuplicateConfigForm({ gcloudPath, configs, onCreated }: Props) {
  const { pop } = useNavigation();
  const [nameError, setNameError] = useState<string | undefined>();
  const [selectedConfig, setSelectedConfig] = useState<string>(configs[0]?.name ?? "");
  const [project, setProject] = useState<string>("");
  const [account, setAccount] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  useEffect(() => {
    const source = configs.find((c) => c.name === selectedConfig);
    if (source) {
      setProject(source.properties?.core?.project ?? "");
      setAccount(source.properties?.core?.account ?? "");
      setRegion(source.properties?.compute?.region ?? "");
    }
  }, [selectedConfig, configs]);

  async function handleSubmit(values: { sourceConfig: string; newName: string; project: string; account: string; region: string }) {
    if (!values.newName) {
      setNameError("New configuration name is required");
      return;
    }
    try {
      await createConfiguration(gcloudPath, values.newName, {
        project: values.project || undefined,
        account: values.account || undefined,
        region: values.region || undefined,
      });
      await showToast({
        style: Toast.Style.Success,
        title: "Configuration duplicated",
        message: `Created ${values.newName} from ${values.sourceConfig}`,
      });
      onCreated();
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to duplicate configuration",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Duplicate Configuration" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="sourceConfig"
        title="Source Configuration"
        value={selectedConfig}
        onChange={setSelectedConfig}
      >
        {configs.map((c) => (
          <Form.Dropdown.Item key={c.name} value={c.name} title={c.name} />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="newName"
        title="New Configuration Name"
        placeholder="my-config-copy"
        error={nameError}
        onChange={() => nameError && setNameError(undefined)}
        onBlur={(e) => {
          if (!e.target.value?.length) setNameError("New configuration name is required");
        }}
      />
      <Form.TextField id="project" title="Project ID" placeholder="my-gcp-project" value={project} onChange={setProject} />
      <Form.TextField
        id="account"
        title="Account Email"
        placeholder="user@example.com"
        value={account}
        onChange={setAccount}
      />
      <Form.TextField id="region" title="Region" placeholder="us-central1" value={region} onChange={setRegion} />
    </Form>
  );
}
