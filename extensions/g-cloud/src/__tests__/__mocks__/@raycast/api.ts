export const showToast = jest.fn();
export const popToRoot = jest.fn();

export const Toast = {
  Style: {
    Success: "success",
    Failure: "failure",
    Animated: "animated",
  },
};

export const ActionPanel = jest.fn();
export const Action = {
  SubmitForm: jest.fn(),
};
export const Form = {
  TextField: jest.fn(),
  Dropdown: jest.fn(),
};
export const List = {
  Item: jest.fn(),
};
export const Icon = {
  CheckCircle: "check-circle",
  Trash: "trash",
  RotateClockwise: "rotate-clockwise",
  Plus: "plus",
  CopyClipboard: "copy-clipboard",
};
export const Color = {
  Green: "green",
  Red: "red",
  SecondaryText: "secondary-text",
};
export const confirmAlert = jest.fn();
export const Alert = {
  ActionStyle: {
    Destructive: "destructive",
  },
};
export const useNavigation = jest.fn(() => ({
  push: jest.fn(),
  pop: jest.fn(),
}));
export const getPreferenceValues = jest.fn(() => ({}));
