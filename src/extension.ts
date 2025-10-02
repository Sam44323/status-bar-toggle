import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const states = ["DEFAULT", "ATTACKER", "USER", "CORRECT-EXECUTION"];

  let current = context.workspaceState.get(
    "statusbarToggle.current",
    states[0]
  );
  let flowInfo = context.workspaceState.get("statusbarToggle.flowInfo", "");
  let reminder = context.workspaceState.get("statusbarToggle.reminder", "");

  // status bar item (text only)
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  // map each state to a hex color
  const stateToHex: Record<string, string | undefined> = {
    DEFAULT: undefined,
    ATTACKER: "#8B0000", // dark red
    USER: "#007ACC", // vscode-blue
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
        if (!context.workspaceState.get("statusbarToggle.originalColors")) {
          await context.workspaceState.update(
            "statusbarToggle.originalColors",
            currentCustomizations
          );
        }

        const merged = {
          ...currentCustomizations,
          "statusBar.background": hex,
          "statusBar.foreground": "#FFFFFF",
          "statusBar.noFolderBackground": hex,
        };

        await config.update(key, merged, vscode.ConfigurationTarget.Global);
      } else {
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
          const cleaned = { ...currentCustomizations };
          delete cleaned["statusBar.background"];
          delete cleaned["statusBar.foreground"];
          delete cleaned["statusBar.noFolderBackground"];
          await config.update(key, cleaned, vscode.ConfigurationTarget.Global);
        }
      }
    } catch (err) {
      console.error("Failed to update workbench.colorCustomizations:", err);
      vscode.window.showWarningMessage(
        "Could not change status bar color (check settings permissions)."
      );
    }
  }

  const updateStatusBar = () => {
    item.text = `$(person) ${current}${flowInfo ? " | " + flowInfo : ""}`;
    item.color = undefined;
    item.show();
  };

  // initialize
  (async () => {
    const hex = stateToHex[current as string];
    if (hex) {
      await applyStatusBarColor(hex);
    } else {
      await applyStatusBarColor(undefined);
    }
    updateStatusBar();
  })();

  // reminder popup
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

  // Commands: state, flow info, reminder
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

  // restore on deactivate
  context.subscriptions.push({
    dispose: async () => {
      await applyStatusBarColor(undefined);
    },
  });

  // ---------------- HOTPOINT FEATURE ----------------

  // ---------------- HOTPOINT FEATURE ----------------

  // ---------------- HOTPOINT FEATURE ----------------

  interface Hotpoint {
    uri: string; // file URI
    range: vscode.Range;
    name: string; // user-provided label
  }

  const hotpoints: Hotpoint[] = context.workspaceState.get<Hotpoint[]>(
    "hotpoints",
    []
  );

  // faded red with 15% opacity
  const hotpointDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255,0,0,0.15)",
  });

  function refreshHotpoints() {
    vscode.window.visibleTextEditors.forEach((editor) => {
      const ranges = hotpoints
        .filter((h) => h.uri === editor.document.uri.toString())
        .map((h) => h.range);
      editor.setDecorations(hotpointDecoration, ranges);
    });
  }

  async function saveHotpoints() {
    await context.workspaceState.update("hotpoints", hotpoints);
    refreshHotpoints();
  }

  const addHotpoint = vscode.commands.registerCommand(
    "hotpoints.add",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage("Select code to mark as hotpoint.");
        return;
      }

      // ask user for a name
      const name = await vscode.window.showInputBox({
        prompt: "Enter a name for this hotpoint",
        placeHolder: "e.g. Critical function, API call, loop bug",
      });

      if (!name) {
        vscode.window.showWarningMessage("Hotpoint name is required.");
        return;
      }

      hotpoints.push({
        uri: editor.document.uri.toString(),
        range: selection,
        name,
      });

      await saveHotpoints();
    }
  );

  const listHotpoints = vscode.commands.registerCommand(
    "hotpoints.list",
    async () => {
      if (hotpoints.length === 0) {
        vscode.window.showInformationMessage("No hotpoints set.");
        return;
      }

      const picked = await vscode.window.showQuickPick(
        hotpoints.map((h, i) => ({
          label: h.name, // use name instead of code snippet
          description: vscode.Uri.parse(h.uri).fsPath,
          index: i,
        })),
        { placeHolder: "Select a hotpoint" }
      );

      if (!picked) return;

      const hotpoint = hotpoints[picked.index];
      const doc = await vscode.workspace.openTextDocument(
        vscode.Uri.parse(hotpoint.uri)
      );
      const editor = await vscode.window.showTextDocument(doc);
      editor.selection = new vscode.Selection(
        hotpoint.range.start,
        hotpoint.range.end
      );
      editor.revealRange(hotpoint.range, vscode.TextEditorRevealType.InCenter);

      const action = await vscode.window.showQuickPick(["Go", "Delete"], {
        placeHolder: "Do you want to delete this hotpoint?",
      });
      if (action === "Delete") {
        hotpoints.splice(picked.index, 1);
        await saveHotpoints();
      }
    }
  );

  context.subscriptions.push(addHotpoint, listHotpoints);

  vscode.window.onDidChangeVisibleTextEditors(refreshHotpoints);
  vscode.workspace.onDidChangeTextDocument(refreshHotpoints);

  refreshHotpoints();
}

// deactivate
export async function deactivate() {
  return;
}
