/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOTTERY_FACTORY_ADDRESS: string
  // 可以添加更多环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
