export const AuthLayout = ({ children, authMode, imageSrc }) => {
  const isRegister = authMode === 'register';

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-white px-3 py-3 app-dark:bg-[#0f1114] md:px-4 md:py-4">
      <div className="flex h-[min(100vh-24px,720px)] w-full max-w-[1180px] overflow-hidden rounded-[24px] max-md:h-auto max-md:max-h-[calc(100vh-24px)]">
        <div className="relative flex w-full flex-1 max-md:flex-col-reverse max-md:gap-3">
          <div
            className={`relative z-[2] flex w-[45%] flex-col items-center justify-center overflow-y-auto px-5 py-4 transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] max-md:w-full max-md:flex-none max-md:px-0 max-md:py-1 max-md:!translate-x-0 ${
              isRegister ? 'translate-x-[122.22%]' : 'translate-x-0'
            }`}
          >
            <div className="w-full max-w-[360px]">
              {children}
            </div>
          </div>
          <div
            className={`relative z-[3] w-[55%] transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] max-md:h-[180px] max-md:w-full max-md:flex-none max-md:!translate-x-0 ${
              isRegister ? '-translate-x-[81.81%]' : 'translate-x-0'
            }`}
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
