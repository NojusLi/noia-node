import EventEmitter from "events";
import fs from "fs";
import jsonfile from "jsonfile";
import path from "path";

import { randomString } from "./utils";
import logger from "./logger";

export enum Options {
    isHeadless = "isHeadless",
    statisticsPath = "statisticsPath",
    storageDir = "storage.dir",
    storageSize = "storage.size",
    domain = "domain",
    ssl = "ssl",
    sslPrivateKeyPath = "ssl.privateKeyPath",
    sslCrtPath = "ssl.crtPath",
    sslCrtBundlePath = "ssl.crtBundlePath",
    publicIp = "publicIp",
    natPmp = "natPmp",
    http = "sockets.http",
    httpIp = "sockets.http.ip",
    httpPort = "sockets.http.port",
    ws = "sockets.ws",
    wsIp = "sockets.ws.ip",
    wsPort = "sockets.ws.port",
    wrtc = "sockets.wrtc",
    wrtcControlPort = "sockets.wrtc.control.port",
    wrtcControlIp = "sockets.wrtc.control.ip",
    wrtcDataPort = "sockets.wrtc.data.port",
    wrtcDataIp = "sockets.wrtc.data.ip",
    walletAddress = "wallet.address",
    walletMnemonic = "wallet.mnemonic",
    walletProviderUrl = "wallet.providerUrl",
    client = "client",
    masterAddress = "masterAddress",
    whitelistMasters = "whitelist.masters",
    controller = "controller",
    controllerIp = "controller.ip",
    controllerPort = "controller.port",
    skipBlockchain = "skipBlockchain",
    nodeId = "nodeId"
}

export class Settings extends EventEmitter {
    public opts: {
        isHeadless: boolean;
        userDataPath?: string;
        settingsPath: string;
        statisticsPath: string;
        storageDir: string;
        storageSize: string;
        domain: string;
        ssl: boolean;
        sslPrivateKeyPath: string;
        sslCrtPath: string;
        sslCrtBundlePath: string;
        publicIp: string;
        natPmp: boolean;
        http: boolean;
        httpIp: string;
        httpPort: string;
        ws: boolean;
        wsIp: string;
        wsPort: string;
        wrtc: boolean;
        wrtcControlPort: string;
        wrtcControlIp: string;
        wrtcDataPort: string;
        wrtcDataIp: string;
        walletAddress: string;
        walletMnemonic: string;
        walletProviderUrl: string;
        client: string;
        masterAddress: string;
        whitelistMasters: string[];
        controller: boolean;
        controllerIp: string;
        controllerPort: string;
        skipBlockchain: boolean;
        nodeId: string;
    };
    public file: string;
    public settings: any;
    public ready: any;
    public Options = Options;

    constructor(opts: any) {
        super();
        this.opts = opts || {};
        this.opts.userDataPath = typeof this.opts.userDataPath !== "string" ? "" : this.opts.userDataPath;

        this.file = path.resolve(this.opts.settingsPath ? this.opts.settingsPath : path.join(this.opts.userDataPath, "settings.json"));

        logger.info(`Configuration filepath=${this.file}.`);

        if (!fs.existsSync(this.file)) {
            this._write({});
        } else {
            try {
                const savedSettings = JSON.parse(JSON.stringify(this._read()));
            } catch (ex) {
                this._write({});
            }
        }

        this.settings = this._read();

        const idPrefix = this.opts.isHeadless ? "terminal" : "gui";
        this.update(Options.isHeadless, this.opts.isHeadless, false);
        this.update(Options.skipBlockchain, this.opts.skipBlockchain, true);
        const skipBlockchain = this.get(Options.skipBlockchain);
        this.update(Options.statisticsPath, this.opts.statisticsPath, path.resolve(path.join(this.opts.userDataPath, "statistics.json")));
        this.update(Options.storageDir, this.opts.storageDir, path.resolve(this.opts.userDataPath, "./storage"));
        this.update(Options.storageSize, this.opts.storageSize, "104857600");
        this.update(Options.domain, this.opts.domain, "");
        this.get(Options.ssl) === true && this.sslPathsExist() === false
            ? this.update(Options.ssl, false)
            : this.update(Options.ssl, this.opts.ssl, false);
        this.update(Options.sslPrivateKeyPath, this.opts.sslPrivateKeyPath, "");
        this.update(Options.sslCrtPath, this.opts.sslCrtPath, "");
        this.update(Options.sslCrtBundlePath, this.opts.sslCrtBundlePath, "");
        this.update(Options.publicIp, this.opts.publicIp, "");
        this.update(Options.natPmp, this.opts.natPmp, false);
        this.update(Options.http, this.opts.http, false);
        this.update(Options.httpIp, this.opts.httpIp, "0.0.0.0");
        this.update(Options.httpPort, this.opts.httpPort, "6767");
        this.update(Options.ws, this.opts.ws, false);
        this.update(Options.wsIp, this.opts.wsIp, "0.0.0.0");
        this.update(Options.wsPort, this.opts.wsPort, "7676");
        this.update(Options.wrtc, this.opts.wrtc, true);
        this.update(Options.wrtcControlPort, this.opts.wrtcControlPort, "8048");
        this.update(Options.wrtcControlIp, this.opts.wrtcControlIp, "0.0.0.0");
        this.update(Options.wrtcDataPort, this.opts.wrtcDataPort, "8058");
        this.update(Options.wrtcDataIp, this.opts.wrtcDataIp, undefined);
        this.update(Options.walletAddress, this.opts.walletAddress, skipBlockchain ? "" : undefined);
        this.update(Options.walletMnemonic, this.opts.walletMnemonic, () => randomString(20));
        this.update(Options.walletProviderUrl, this.opts.walletProviderUrl, skipBlockchain ? undefined : "");
        this.update(Options.client, this.opts.client);
        this.update(Options.masterAddress, this.opts.masterAddress, skipBlockchain ? "" : undefined);
        this.update(Options.whitelistMasters, this.opts.whitelistMasters, []);
        this.update(Options.controller, this.opts.controller, false);
        this.update(Options.controllerIp, this.opts.controllerIp, "127.0.0.1");
        this.update(Options.controllerPort, this.opts.controllerPort, "9000");
        this.update(Options.nodeId, this.opts.nodeId, () => randomString(40));

        // resolve to full paths
        const storageDir = this.get(Options.storageDir);
        if (storageDir) {
            this.update(Options.storageDir, path.resolve(storageDir));
        }

        const sslPrivateKeyPath = this.get(Options.sslPrivateKeyPath);
        if (sslPrivateKeyPath) {
            this.update(Options.sslPrivateKeyPath, path.resolve(sslPrivateKeyPath));
        }

        const sslCrtPath = this.get(Options.sslCrtPath);
        if (sslCrtPath) {
            this.update(Options.sslCrtPath, path.resolve(sslCrtPath));
        }

        const sslCrtBundlePath = this.get(Options.sslCrtBundlePath);
        if (sslCrtBundlePath) {
            this.update(Options.sslCrtBundlePath, path.resolve(sslCrtBundlePath));
        }

        this.ready = true;
    }

    get(key: Options) {
        if (key) {
            return this.settings[key];
        } else {
            return this.settings;
        }
    }

    update(key: Options, value: any, defaultValue?: any) {
        const settings = this._read();
        if (isMeaningful(value) && settings[key] !== value) {
            settings[key] = value;
            this._write(settings);
        } else if (settings[key] === null || typeof settings[key] === "undefined") {
            if (typeof defaultValue === "function") {
                settings[key] = defaultValue();
                this._write(settings);
            } else {
                // FIXME
                settings[key] = defaultValue;
                this._write(settings);
            }
        }
    }

    remove(key: Options) {
        const settings = this._read();
        delete settings[key];
        this._write(settings);
    }

    _write(settings: any) {
        const self = this;
        const notified: string[] = [];
        const checkChanged = (s1: any, s2: any, notified: string[], reverse: boolean = false) => {
            if (typeof s1 === "undefined" || s1 === null) {
                return;
            }
            const keys: string[] = Object.keys(s1);
            keys.forEach((key: string) => {
                let isSame = true;
                if (Array.isArray(s1[key])) {
                    if (!s1[key] || !s2[key]) {
                        isSame = false;
                    } else {
                        isSame = s1[key].every((e: any) => s2[key].includes(e));
                    }
                } else {
                    isSame = s1[key] === s2[key];
                }
                if (!isSame) {
                    if (notified.includes(key)) return;
                    notified.push(key);
                    if (reverse) {
                        logger.info(`Setting configuration key=${key} oldValue=${s1[key]} newValue=${s2[key]}.`);
                    } else {
                        logger.info(`Setting configuration key=${key} oldValue=${s2[key]} newValue=${s1[key]}.`);
                    }
                    self.emit("changed", { key, value: s1[key] });
                }
            });
        };

        checkChanged(settings, this.settings, notified, false);
        checkChanged(this.settings, settings, notified, true);

        jsonfile.writeFileSync(this.file, settings, { spaces: 2 });
        this.settings = settings;
    }

    _read() {
        return jsonfile.readFileSync(this.file);
    }

    private sslPathsExist(): boolean {
        let ssl = true;
        if (this.get(Options.ssl) === true) {
            const sslPrivateKeyPath = this.get(Options.sslPrivateKeyPath);
            const sslCrtPath = this.get(Options.sslCrtPath);
            const sslCrtBundlePath = this.get(Options.sslCrtBundlePath);
            if (!fs.existsSync(sslPrivateKeyPath)) {
                ssl = false;
                logger.warn(`No such file: ${sslPrivateKeyPath}, fallback ssl=${ssl}.`);
            }
            if (!fs.existsSync(sslCrtPath)) {
                ssl = false;
                logger.warn(`No such file: ${sslCrtPath}, fallback ssl=${ssl}.`);
            }
            if (!fs.existsSync(sslCrtBundlePath)) {
                ssl = false;
                logger.warn(`No such file: ${sslCrtBundlePath}, fallback ssl=${ssl}.`);
            }
        }
        return ssl;
    }
}

function isMeaningful(value: any) {
    if (value !== null && typeof value !== "undefined" && value !== "") {
        return true;
    } else {
        return false;
    }
}
