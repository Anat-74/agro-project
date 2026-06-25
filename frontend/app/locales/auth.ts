export const authTranslations: Record<LocaleCode, {
  loginTitle: string
  registerTitle: string
  forgotTitle: string
  resetTitle: string
  emailLabel: string
  passwordLabel: string
  usernameLabel: string
  codeLabel: string
  newPasswordLabel: string
  confirmPasswordLabel: string
  loginButton: string
  registerButton: string
  forgotButton: string
  resetButton: string
  noAccount: string
  hasAccount: string
  forgotLink: string
  backToLogin: string
  emailSent: string
  logout: string
  errors: {
    invalidCredentials: string
    emailTaken: string
    usernameTaken: string
    weakPassword: string
    required: string
    emailNotFound: string
    invalidCode: string
    passwordsDontMatch: string
  }
}> = {
  ru: {
    loginTitle: 'Вход',
    registerTitle: 'Регистрация',
    forgotTitle: 'Восстановление пароля',
    resetTitle: 'Новый пароль',
    emailLabel: 'Email',
    passwordLabel: 'Пароль',
    usernameLabel: 'Имя пользователя',
    codeLabel: 'Код из письма',
    newPasswordLabel: 'Новый пароль',
    confirmPasswordLabel: 'Подтвердите пароль',
    loginButton: 'Войти',
    registerButton: 'Зарегистрироваться',
    forgotButton: 'Отправить',
    resetButton: 'Сохранить',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?',
    forgotLink: 'Забыли пароль?',
    backToLogin: '← Вернуться ко входу',
    emailSent: 'Если email существует, письмо отправлено',
    logout: 'Выйти',
    errors: {
      invalidCredentials: 'Неверный email или пароль',
      emailTaken: 'Этот email уже зарегистрирован',
      usernameTaken: 'Это имя пользователя уже занято',
      weakPassword: 'Пароль должен содержать минимум 6 символов',
      required: 'Обязательное поле',
      emailNotFound: 'Пользователь с таким email не найден',
      invalidCode: 'Неверный или просроченный код',
      passwordsDontMatch: 'Пароли не совпадают',
    },
  },
  be: {
    loginTitle: 'Уваход',
    registerTitle: 'Рэгістрацыя',
    forgotTitle: 'Аднаўленне пароля',
    resetTitle: 'Новы пароль',
    emailLabel: 'Email',
    passwordLabel: 'Пароль',
    usernameLabel: 'Імя карыстальніка',
    codeLabel: 'Код з ліста',
    newPasswordLabel: 'Новы пароль',
    confirmPasswordLabel: 'Пацвердзіце пароль',
    loginButton: 'Увайсці',
    registerButton: 'Зарэгістравацца',
    forgotButton: 'Адправіць',
    resetButton: 'Захаваць',
    noAccount: 'Няма акаўнта?',
    hasAccount: 'Ужо ёсць акаўнт?',
    forgotLink: 'Забылі пароль?',
    backToLogin: '← Вярнуцца да ўваходу',
    emailSent: 'Калі email існуе, ліст адпраўлены',
    logout: 'Выйсці',
    errors: {
      invalidCredentials: 'Няправільны email ці пароль',
      emailTaken: 'Гэты email ужо зарэгістраваны',
      usernameTaken: 'Гэтае імя карыстальніка ўжо занятае',
      weakPassword: 'Пароль павінен утрымліваць мінімум 6 сімвалаў',
      required: 'Абавязковае поле',
      emailNotFound: 'Карыстальнік з такім email не знойдзены',
      invalidCode: 'Няправільны або пратэрмінаваны код',
      passwordsDontMatch: 'Паролі не супадаюць',
    },
  },
}
