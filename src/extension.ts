import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  // Define states and corresponding dark colors
  const states: { [key: string]: string } = {
    DEFAULT: "#444444",
    ATTACKER: "#800000",
    USER: "#6A0DAD",
    "CORRECT-EXECUTION": "#006400",
  };

  // Load workspace-scoped persisted state
  let current =
    context.workspaceState.get<string>("statusbarToggleState") || "DEFAULT";
  let flowInfo = context.workspaceState.get<string>("statusbarFlowInfo") || "";

  // Create the status bar item
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  // Ensure status bar is rendered on startup
  setTimeout(() => {
    updateStatusBar(item, current, flowInfo, states);
    item.show();

    // Restore background color
    const config = vscode.workspace.getConfiguration();
    config.update(
      "workbench.colorCustomizations",
      {
        "statusBar.background": states[current],
        "statusBar.noFolderBackground": states[current],
        "statusBar.debuggingBackground": states[current],
        "statusBar.foreground": "#FFFFFF", // always white text
      },
      vscode.ConfigurationTarget.Global
    );
  }, 100);

  // Command 1: Toggle state
  const selectStateCmd = vscode.commands.registerCommand(
    "statusbarToggle.selectState",
    async () => {
      const picked = await vscode.window.showQuickPick(Object.keys(states), {
        placeHolder: "Select a state",
      });
      if (picked) {
        current = picked;
        updateStatusBar(item, current, flowInfo, states);

        // Persist workspace-specific state
        await context.workspaceState.update("statusbarToggleState", current);

        // Update status bar background
        const config = vscode.workspace.getConfiguration();
        config.update(
          "workbench.colorCustomizations",
          {
            "statusBar.background": states[current],
            "statusBar.noFolderBackground": states[current],
            "statusBar.debuggingBackground": states[current],
            "statusBar.foreground": "#FFFFFF",
          },
          vscode.ConfigurationTarget.Global
        );
      }
    }
  );

  // Command 2: Add flow info
  const addFlowInfoCmd = vscode.commands.registerCommand(
    "statusbarToggle.addFlowInfo",
    async () => {
      const input = await vscode.window.showInputBox({
        placeHolder: "Enter current flow information",
      });
      if (input !== undefined) {
        flowInfo = input.trim();
        updateStatusBar(item, current, flowInfo, states);

        // Persist workspace-specific flow info
        await context.workspaceState.update("statusbarFlowInfo", flowInfo);
      }
    }
  );

  context.subscriptions.push(item, selectStateCmd, addFlowInfoCmd);
}

// Helper to update status bar text and tooltip
function updateStatusBar(
  item: vscode.StatusBarItem,
  state: string,
  flowInfo: string,
  states: { [key: string]: string }
) {
  item.text = flowInfo
    ? `$(person) ${state} | $(comment) ${flowInfo}`
    : `$(person) ${state}`;
  item.tooltip = flowInfo
    ? `Current state: ${state}\nFlow: ${flowInfo}`
    : `Current state: ${state}`;
  item.color = "#FFFFFF"; // always white
}

export function deactivate() {}
