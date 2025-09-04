import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const states = ["DEFAULT", "ATTACKER", "USER", "CORRECT-EXECUTION"];

  let current = context.workspaceState.get(
    "statusbarToggle.current",
    states[0]
  );
  let flowInfo = context.workspaceState.get("statusbarToggle.flowInfo", "");
  let reminder = context.workspaceState.get("statusbarToggle.reminder", "");

  // status bar item (text only) — we will color the whole bar via workbench.colorCustomizations
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  // map each state to a hex color for the whole status bar
  const stateToHex: Record<string, string | undefined> = {
    DEFAULT: undefined, // restore user's original
    ATTACKER: "#8B0000", // dark red
    USER: "#007ACC", // vscode-blue (readable with white text)
    "CORRECT-EXECUTION": "#008000", // green
  };

  // helper: apply or restore color customizations
  async function applyStatusBarColor(hex: string | undefined) {
    const config = vscode.workspace.getConfiguration();
    const key = "workbench.colorCustomizations";
    const currentCustomizations =
      config.get<Record<string, unknown>>(key) || {};

    try {
      if (hex) {
        // Save original customizations (only once)
        if (!context.workspaceState.get("statusbarToggle.originalColors")) {
          await context.workspaceState.update(
            "statusbarToggle.originalColors",
            currentCustomizations
          );
        }

        // Merge in our status bar overrides (preserve other user customizations)
        const merged = {
          ...currentCustomizations,
          "statusBar.background": hex,
          "statusBar.foreground": "#FFFFFF",
          // Also ensure no-folder variant (optional)
          "statusBar.noFolderBackground": hex,
        };

        await config.update(key, merged, vscode.ConfigurationTarget.Global);
      } else {
        // Restore original if present
        const original = context.workspaceState.get<Record<string, unknown>>(
          "statusbarToggle.originalColors"
        );
        if (original) {
          await config.update(key, original, vscode.ConfigurationTarget.Global);
          await context.workspaceState.update(
            "statusbarToggle.originalColors",
            undefined
          );
        } else {
          // if no original saved, remove only the keys we may have added
          const cleaned = { ...currentCustomizations };
          delete cleaned["statusBar.background"];
          delete cleaned["statusBar.foreground"];
          delete cleaned["statusBar.noFolderBackground"];
          await config.update(key, cleaned, vscode.ConfigurationTarget.Global);
        }
      }
    } catch (err) {
      // Log and surface small message, but do not crash extension
      console.error("Failed to update workbench.colorCustomizations:", err);
      vscode.window.showWarningMessage(
        "Could not change status bar color (check settings permissions)."
      );
    }
  }

  const updateStatusBar = () => {
    item.text = `$(person) ${current}${flowInfo ? " | " + flowInfo : ""}`;
    // Important: leave item.color undefined so statusBar.foreground (global) controls text color.
    item.color = undefined;
    // Do not set item.backgroundColor — we're changing the entire bar via settings.
    item.show();
  };

  // initialize: apply color for the saved current state if needed
  (async () => {
    const hex = stateToHex[current as string];
    if (hex) {
      await applyStatusBarColor(hex);
    } else {
      // ensure any previous state reset is applied (if DEFAULT)
      await applyStatusBarColor(undefined);
    }
    updateStatusBar();
  })();

  // reminder popup (unchanged)
  if (reminder) {
    vscode.window
      .showInformationMessage(
        `🔔 Reminder: ${reminder}`,
        "Mark as Read",
        "Dismiss"
      )
      .then((selection) => {
        if (selection === "Mark as Read") {
          context.workspaceState.update("statusbarToggle.reminder", "");
        }
      });
  }

  // Commands
  const selectState = vscode.commands.registerCommand(
    "statusbarToggle.selectState",
    async () => {
      const picked = await vscode.window.showQuickPick(states, {
        placeHolder: "Select a state",
      });
      if (picked) {
        current = picked;
        await context.workspaceState.update("statusbarToggle.current", current);

        const hex = stateToHex[current];
        if (hex) {
          await applyStatusBarColor(hex);
        } else {
          // DEFAULT -> restore
          await applyStatusBarColor(undefined);
        }

        updateStatusBar();
      }
    }
  );

  const addFlowInfo = vscode.commands.registerCommand(
    "statusbarToggle.addFlowInfo",
    async () => {
      const input = await vscode.window.showInputBox({
        prompt: "Enter flow info",
      });
      if (input !== undefined) {
        flowInfo = input;
        await context.workspaceState.update(
          "statusbarToggle.flowInfo",
          flowInfo
        );
        updateStatusBar();
      }
    }
  );

  const addReminder = vscode.commands.registerCommand(
    "statusbarToggle.addReminder",
    async () => {
      const input = await vscode.window.showInputBox({
        prompt: "Enter a reminder (will show on reopen)",
      });
      if (input) {
        reminder = input;
        await context.workspaceState.update(
          "statusbarToggle.reminder",
          reminder
        );
        vscode.window.showInformationMessage(`Reminder saved: ${reminder}`);
      }
    }
  );

  context.subscriptions.push(item, selectState, addFlowInfo, addReminder);

  // Make sure we restore on deactivate as a safety
  context.subscriptions.push({
    dispose: async () => {
      // restore original when extension is deactivated/unloaded
      await applyStatusBarColor(undefined);
    },
  });
}

// deactivate: ensure restoration (VS Code will await a Promise if returned)
export async function deactivate() {
  // nothing else required because the subscription restore should run,
  // but also ensure restoration here:
  // NOTE: we can't access the context here; the disposable above already restores.
  return;
}
