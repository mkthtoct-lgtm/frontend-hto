const AUTH_BACKGROUND_IMAGE = "/assets/images/BIA%20%C4%90S/BIA_HTO-04.png";

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
  const formAlignClass = isRegister ? "items-start" : "items-center";
  const imageAlignClass = isRegister ? "justify-end" : "justify-start";

  return (
    <div
      className="flex min-h-screen items-center justify-center overflow-hidden bg-white bg-cover bg-center bg-no-repeat px-3 py-3 app-dark:bg-[#0f1114] md:px-4 md:py-4"
      style={{ backgroundImage: `url("${AUTH_BACKGROUND_IMAGE}")` }}
    >
      <div className={`flex h-[min(100vh-24px,720px)] w-full overflow-hidden rounded-[24px] max-md:h-auto max-md:max-h-[calc(100vh-24px)] ${isRegisterProfile ? "max-w-[1240px]" : "max-w-[1180px]"}`}>
        <div className="relative flex w-full flex-1 max-md:flex-col-reverse max-md:gap-3">
          <div
            className={`auth-scrollbar-hidden relative z-[2] flex ${formWidthClass} flex-col ${formAlignClass} justify-center overflow-y-auto px-4 py-4 transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] max-md:w-full max-md:flex-none max-md:items-center max-md:px-5 max-md:py-4 max-md:!translate-x-0 ${formTranslateClass}`}
          >
            <div className={`w-full rounded-[24px] bg-white/45 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-sm app-dark:bg-[#111827]/50 max-md:p-5 ${isRegister ? registerFormMaxWidthClass : 'max-w-[420px]'}`}>
              {children}
            </div>
          </div>
          <div
            className={`relative z-[3] flex ${imageWidthClass} ${imageAlignClass} items-center overflow-hidden rounded-[24px] transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] max-md:h-auto max-md:w-full max-md:flex-none max-md:justify-center max-md:!translate-x-0 ${imageTranslateClass}`}
          >
            <img
              src={imageSrc}
              alt=""
              className="block aspect-square h-auto max-h-full w-full max-w-full rounded-[24px] object-contain"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
