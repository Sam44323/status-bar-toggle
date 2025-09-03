import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const states = ["DEFAULT", "ATTACKER", "USER", "CORRECT-EXECUTION"];

  let current = context.workspaceState.get(
    "statusbarToggle.current",
    states[0]
  );
  let flowInfo = context.workspaceState.get("statusbarToggle.flowInfo", "");
  let reminder = context.workspaceState.get("statusbarToggle.reminder", "");

  // --- Status Bar item ---
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  const updateStatusBar = () => {
    item.text = `$(person) ${current}${flowInfo ? " | " + flowInfo : ""}`;
    item.color = "#FFFFFF"; // white text
    item.show();
  };
  updateStatusBar();

  // --- Show reminder as a subtle toast on startup ---
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
        // If dismissed → reminder persists and will show again on next reopen
      });
  }

  // --- Commands ---
  const selectState = vscode.commands.registerCommand(
    "statusbarToggle.selectState",
    async () => {
      const picked = await vscode.window.showQuickPick(states, {
        placeHolder: "Select a state",
      });
      if (picked) {
        current = picked;
        context.workspaceState.update("statusbarToggle.current", current);
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
      if (input) {
        flowInfo = input;
        context.workspaceState.update("statusbarToggle.flowInfo", flowInfo);
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
        context.workspaceState.update("statusbarToggle.reminder", reminder);
        vscode.window.showInformationMessage(`Reminder saved: ${reminder}`);
      }
    }
  );

  context.subscriptions.push(item, selectState, addFlowInfo, addReminder);
}

export function deactivate() {}
