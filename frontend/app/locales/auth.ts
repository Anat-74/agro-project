export const authTranslations: Record<LocaleCode, {
  loginTitle: string
  registerTitle: string
  emailLabel: string
  passwordLabel: string
  usernameLabel: string
  loginButton: string
  registerButton: string
  noAccount: string
  hasAccount: string
  logout: string
  errors: {
    invalidCredentials: string
    emailTaken: string
    usernameTaken: string
    weakPassword: string
    required: string
  }
}> = {
  ru: {
    loginTitle: 'Вход',
    registerTitle: 'Регистрация',
    emailLabel: 'Email',
    passwordLabel: 'Пароль',
    usernameLabel: 'Имя пользователя',
    loginButton: 'Войти',
    registerButton: 'Зарегистрироваться',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?',
    logout: 'Выйти',
    errors: {
      invalidCredentials: 'Неверный email или пароль',
      emailTaken: 'Этот email уже зарегистрирован',
      usernameTaken: 'Это имя пользователя уже занято',
      weakPassword: 'Пароль должен содержать минимум 6 символов',
      required: 'Обязательное поле',
    },
  },
  be: {
    loginTitle: 'Уваход',
    registerTitle: 'Рэгістрацыя',
    emailLabel: 'Email',
    passwordLabel: 'Пароль',
    usernameLabel: 'Імя карыстальніка',
    loginButton: 'Увайсці',
    registerButton: 'Зарэгістравацца',
    noAccount: 'Няма акаўнта?',
    hasAccount: 'Ужо ёсць акаўнт?',
    logout: 'Выйсці',
    errors: {
      invalidCredentials: 'Няправільны email ці пароль',
      emailTaken: 'Гэты email ужо зарэгістраваны',
      usernameTaken: 'Гэтае імя карыстальніка ўжо занятае',
      weakPassword: 'Пароль павінен утрымліваць мінімум 6 сімвалаў',
      required: 'Абавязковае поле',
    },
  },
}
