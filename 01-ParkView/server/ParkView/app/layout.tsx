import { Providers } from "./providers";
import "./globals.css";
import { ConfigProvider } from "antd";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Footer from "./components/Footer";

import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';

// import locale from 'antd/locale/zh_CN';
// import dayjs from 'dayjs';

// import 'dayjs/locale/zh-cn';

// dayjs.locale('zh-cn');

export default async function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const locale = await getLocale();
 
    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <NextIntlClientProvider messages={messages}>
                <body className="min-h-screen flex flex-col">
                    <Providers>
                        <ConfigProvider>
                            <div className="flex flex-1 min-h-screen">
                            <Sidebar />
                                <div className="flex flex-col flex-1">
                                    <Header />
                                        <main className="flex-1 pt-1">
                                            {children}
                                        </main>
                                    <Footer/>
                                </div>
                            </div>
                        </ConfigProvider>
                    </Providers>
                </body>
            </NextIntlClientProvider>
        </html>
    );
}
