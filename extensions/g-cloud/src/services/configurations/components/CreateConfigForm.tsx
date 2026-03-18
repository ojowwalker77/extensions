import { ActionPanel, Action, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { createConfiguration } from "../ConfigurationsService";

interface Props {
  gcloudPath: string;
  onCreated: () => void;
}

export function CreateConfigForm({ gcloudPath, onCreated }: Props) {
  const { pop } = useNavigation();
  const [nameError, setNameError] = useState<string | undefined>();

  async function handleSubmit(values: { name: string; project: string; account: string; region: string }) {
    if (!values.name) {
      setNameError("Configuration name is required");
      return;
    }
    try {
      await createConfiguration(gcloudPath, values.name, {
        project: values.project || undefined,
        account: values.account || undefined,
        region: values.region || undefined,
      });
      await showToast({ style: Toast.Style.Success, title: "Configuration created", message: values.name });
      onCreated();
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create configuration",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Configuration" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Configuration Name"
        placeholder="my-config"
        error={nameError}
        onChange={() => nameError && setNameError(undefined)}
        onBlur={(e) => {
          if (!e.target.value?.length) setNameError("Configuration name is required");
        }}
      />
      <Form.TextField id="project" title="Project ID" placeholder="my-gcp-project" />
      <Form.TextField id="account" title="Account Email" placeholder="user@example.com" />
      <Form.TextField id="region" title="Region" placeholder="us-central1" defaultValue="us-central1" />
    </Form>
  );
}
