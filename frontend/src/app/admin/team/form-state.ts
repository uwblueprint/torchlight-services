export type InviteField = "email" | "display_name" | "role";

export type InviteFieldErrors = Partial<Record<InviteField, string>>;

export type InviteFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: InviteFieldErrors;
};

export const initialInviteFormState: InviteFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export type RowActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialRowActionState: RowActionState = {
  status: "idle",
  message: "",
};
