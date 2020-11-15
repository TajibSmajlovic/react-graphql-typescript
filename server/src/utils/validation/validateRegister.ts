interface Error {
  field?: string;
  message: string;
}

export const validateRegister = (
  username: string,
  email: string,
  password: string
) => {
  const errors: Error[] = [];

  if (!username.length)
    errors.push({
      field: "username",
      message: "Username can't be empty",
    });

  if (username.includes("@"))
    errors.push({
      field: "username",
      message: "Can't include '@' in username",
    });

  if (!email.includes("@"))
    errors.push({
      field: "email",
      message: "E-mail must have '@'",
    });

  if (password.length <= 6) {
    errors.push({
      field: "password",
      message: "Password must be at least 6 characters long",
    });
  }

  return errors;
};
