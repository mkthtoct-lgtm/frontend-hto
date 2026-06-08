export const AuthLayout = ({ children, authMode, imageSrc, registerLayoutMode = "account" }) => {
  const isRegister = authMode === 'register';
  const isRegisterProfile = isRegister && registerLayoutMode === "profile";
  const formWidthClass = isRegisterProfile ? "w-1/2" : "w-[45%]";
  const imageWidthClass = isRegisterProfile ? "w-1/2" : "w-[55%]";
  const registerFormMaxWidthClass = isRegisterProfile ? "max-w-[600px]" : "max-w-[500px]";
  const formTranslateClass = isRegister
    ? isRegisterProfile
      ? "translate-x-full"
      : "translate-x-[122.22%]"
    : "translate-x-0";
  const imageTranslateClass = isRegister
    ? isRegisterProfile
      ? "-translate-x-full"
      : "-translate-x-[81.81%]"
    : "translate-x-0";

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-white px-3 py-3 app-dark:bg-[#0f1114] md:px-4 md:py-4">
      <div className={`flex h-[min(100vh-24px,720px)] w-full overflow-hidden rounded-[24px] max-md:h-auto max-md:max-h-[calc(100vh-24px)] ${isRegisterProfile ? "max-w-[1240px]" : "max-w-[1180px]"}`}>
        <div className="relative flex w-full flex-1 max-md:flex-col-reverse max-md:gap-3">
          <div
            className={`auth-scrollbar-hidden relative z-[2] flex ${formWidthClass} flex-col items-center justify-center overflow-y-auto px-5 py-4 transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] max-md:w-full max-md:flex-none max-md:px-0 max-md:py-1 max-md:!translate-x-0 ${formTranslateClass}`}
          >
            <div className={`w-full ${isRegister ? registerFormMaxWidthClass : 'max-w-[360px]'}`}>
              {children}
            </div>
          </div>
          <div
            className={`relative z-[3] ${imageWidthClass} transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] max-md:h-[180px] max-md:w-full max-md:flex-none max-md:!translate-x-0 ${imageTranslateClass}`}
          >
            <div
              className="h-full min-h-full w-full rounded-[24px] bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${imageSrc})` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
