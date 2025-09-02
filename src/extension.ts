import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const states: { [key: string]: string } = {
    DEFAULT: "#444444", // dark gray
    ATTACKER: "#800000", // dark red
    USER: "#6A0DAD", // dark violet
    "CORRECT-EXECUTION": "#006400", // dark green
  };

  // Load saved state (fallback to DEFAULT)
  let current =
    context.globalState.get<string>("statusbarToggleState") || "DEFAULT";
  let flowInfo = context.globalState.get<string>("statusbarFlowInfo") || "";

  // Create status bar item
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  updateStatusBar(item, current, flowInfo, states);
  item.show();

  // Command 1: Select State
  const selectStateCmd = vscode.commands.registerCommand(
    "statusbarToggle.selectState",
    async () => {
      const picked = await vscode.window.showQuickPick(Object.keys(states), {
        placeHolder: "Select a state",
      });

      if (picked) {
        current = picked;
        updateStatusBar(item, current, flowInfo, states);

        // persist across reloads
        await context.globalState.update("statusbarToggleState", current);

        // persist status bar background too
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
      }
    }
  );

  // Command 2: Add Flow Info
  const addFlowInfoCmd = vscode.commands.registerCommand(
    "statusbarToggle.addFlowInfo",
    async () => {
      const input = await vscode.window.showInputBox({
        placeHolder: "Enter current flow information",
      });

      if (input !== undefined) {
        flowInfo = input.trim();
        updateStatusBar(item, current, flowInfo, states);

        // persist across reloads
        await context.globalState.update("statusbarFlowInfo", flowInfo);
      }
    }
  );

  context.subscriptions.push(item);
  context.subscriptions.push(selectStateCmd);
  context.subscriptions.push(addFlowInfoCmd);
}

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
  item.color = "#FFFFFF"; // always white text
}

export function deactivate() {}
