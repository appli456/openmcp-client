import * as vscode from 'vscode';
import * as os from 'os';
import * as fspath from 'path';
import * as fs from 'fs';

export type FsPath = string;
export const panels = new Map<FsPath, vscode.WebviewPanel>();

export interface IStdioConnectionItem {
    type: 'stdio';
    name: string;
    version?: string;
    command: string;
    args: string[];
    cwd?: string;
    env?: { [key: string]: string };
    filePath?: string;
}

export interface ISSEConnectionItem {
    type: 'sse';
    name: string;
    version: string;
    url: string;
    oauth?: string;
    env?: { [key: string]: string };
    filePath?: string;
}


interface IStdioLaunchSignature {
    type: 'stdio';
    commandString: string;
    cwd: string;
}

interface ISSELaunchSignature {
    type:'sse';
    url: string;
    oauth: string;
}

export type IConnectionItem = IStdioConnectionItem | ISSEConnectionItem;
export type ILaunchSigature = IStdioLaunchSignature | ISSELaunchSignature;

export interface IConnectionConfig {
    items: IConnectionItem[];
}

export const CONNECTION_CONFIG_NAME = 'openmcp_connection.json';

let _connectionConfig: IConnectionConfig | undefined;
let _workspaceConnectionConfig: IConnectionConfig | undefined;

/**
 * @description 获取全局的连接信息，全局文件信息都是绝对路径
 * @returns 
 */
export function getConnectionConfig() {
    if (_connectionConfig) {
        return _connectionConfig;
    }
    const homeDir = os.homedir();
    const configDir = fspath.join(homeDir, '.openmcp');
    const connectionConfig = fspath.join(configDir, CONNECTION_CONFIG_NAME);
    if (!fs.existsSync(connectionConfig)) {
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(connectionConfig, JSON.stringify({ items: [] }), 'utf-8');
    }

    const rawConnectionString = fs.readFileSync(connectionConfig, 'utf-8');
    let connection;
    try {
        connection = JSON.parse(rawConnectionString) as IConnectionConfig;        
    } catch (error) {
        connection = { items: [] };
    }
    
    _connectionConfig = connection;
    return connection;
}

/**
 * @description 获取工作区的连接信息，默认是 {workspace}/.vscode/openmcp_connection.json
 * @returns 
 */
export function getWorkspaceConnectionConfigPath() {
    const workspace = getWorkspacePath();
    const configDir = fspath.join(workspace, '.vscode');
    const connectionConfig = fspath.join(configDir, CONNECTION_CONFIG_NAME);
    return connectionConfig;
}

/**
 * @description 获取工作区的连接信息，工作区的连接文件的路径都是相对路径，以 {workspace} 开头
 * @param workspace 
 */
export function getWorkspaceConnectionConfig() {
    if (_workspaceConnectionConfig) {
        return _workspaceConnectionConfig;
    }

    const workspace = getWorkspacePath();
    const configDir = fspath.join(workspace, '.vscode');
    const connectionConfig = fspath.join(configDir, CONNECTION_CONFIG_NAME);

    if (!fs.existsSync(connectionConfig)) {
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(connectionConfig, JSON.stringify({ items: [] }), 'utf-8');
    }

    const rawConnectionString = fs.readFileSync(connectionConfig, 'utf-8');

    let connection;
    try {
        connection = JSON.parse(rawConnectionString) as IConnectionConfig;        
    } catch (error) {
        connection = { items: [] };
    }

    const workspacePath = getWorkspacePath();
    for (const item of connection.items) {
        if (item.filePath && item.filePath.startsWith('{workspace}')) {
            item.filePath = item.filePath.replace('{workspace}', workspacePath).replace(/\\/g, '/');
        }
        if (item.type === 'stdio' && item.cwd && item.cwd.startsWith('{workspace}')) {
            item.cwd = item.cwd.replace('{workspace}', workspacePath).replace(/\\/g, '/');
        }
    }

    _workspaceConnectionConfig = connection;
    return connection;
}

export function getInstalledConnectionConfigPath() {
    const homeDir = os.homedir();
    const configDir = fspath.join(homeDir, '.openmcp');
    const connectionConfig = fspath.join(configDir, CONNECTION_CONFIG_NAME);
    return connectionConfig;
}

/**
 * @description 保存连接信息到全局配置文件，这个部分和「安装的连接」对应
 * @returns 
 */
export function saveConnectionConfig() {
    if (!_connectionConfig) {
        return;
    }

    const connectionConfig = getInstalledConnectionConfigPath();

    fs.writeFileSync(connectionConfig, JSON.stringify(_connectionConfig, null, 2), 'utf-8');
}

export function saveWorkspaceConnectionConfig(workspace: string) {

    if (!_workspaceConnectionConfig) {
        return;
    }

    const connectionConfig = JSON.parse(JSON.stringify(_workspaceConnectionConfig)) as IConnectionConfig;

    const configDir = fspath.join(workspace, '.vscode');
    const connectionConfigPath = fspath.join(configDir, CONNECTION_CONFIG_NAME);

    const workspacePath = getWorkspacePath();
    for (const item of connectionConfig.items) {
        if (item.filePath && item.filePath.replace(/\\/g, '/').startsWith(workspacePath)) {
            item.filePath = item.filePath.replace(workspacePath, '{workspace}').replace(/\\/g, '/');
        }
        if (item.type ==='stdio' && item.cwd && item.cwd.replace(/\\/g, '/').startsWith(workspacePath)) {
            item.cwd = item.cwd.replace(workspacePath, '{workspace}').replace(/\\/g, '/');
        }
    }
    fs.writeFileSync(connectionConfigPath, JSON.stringify(connectionConfig, null, 2), 'utf-8');
}

interface ClientStdioConnectionItem {
    command: string;
    args: string[];
    connectionType: 'STDIO';
    cwd: string;
    env: { [key: string]: string };
}

interface ClientSseConnectionItem {
    url: string;
    connectionType: 'SSE';
    oauth: string;
    env: { [key: string]: string };
}

interface ServerInfo {
    name: string;
    version: string;
}

export function updateWorkspaceConnectionConfig(
    absPath: string,
    data: (ClientStdioConnectionItem | ClientSseConnectionItem) & { serverInfo: ServerInfo }
) {
    const connectionItem = getWorkspaceConnectionConfigItemByPath(absPath);    
    const workspaceConnectionConfig = getWorkspaceConnectionConfig();

    // 如果存在，删除老的 connectionItem
    if (connectionItem) {
        const index = workspaceConnectionConfig.items.indexOf(connectionItem);
        if (index !== -1) {
            workspaceConnectionConfig.items.splice(index, 1);
        }
    }

    if (data.connectionType === 'STDIO') {
        const connectionItem: IStdioConnectionItem = {
            type: 'stdio',
            name: data.serverInfo.name,
            version: data.serverInfo.version,
            command: data.command,
            args: data.args,
            cwd: data.cwd.replace(/\\/g, '/'),
            env: data.env,
            filePath: absPath.replace(/\\/g, '/')
        };

        console.log('get connectionItem: ', connectionItem);
        

        // 插入到第一个
        workspaceConnectionConfig.items.unshift(connectionItem);
        const workspacePath = getWorkspacePath();
        saveWorkspaceConnectionConfig(workspacePath);
        vscode.commands.executeCommand('openmcp.sidebar.workspace-connection.refresh');

    } else {
        const connectionItem: ISSEConnectionItem = {
            type: 'sse',
            name: data.serverInfo.name,
            version: data.serverInfo.version,
            url: data.url,
            oauth: data.oauth,
            filePath: absPath.replace(/\\/g, '/')
        };

        // 插入到第一个
        workspaceConnectionConfig.items.unshift(connectionItem);
        const workspacePath = getWorkspacePath();
        saveWorkspaceConnectionConfig(workspacePath);
        vscode.commands.executeCommand('openmcp.sidebar.workspace-connection.refresh');
    }
}

export function updateInstalledConnectionConfig(
    absPath: string,
    data: (ClientStdioConnectionItem | ClientSseConnectionItem) & { serverInfo: ServerInfo }
) {
    const connectionItem = getInstalledConnectionConfigItemByPath(absPath);
    const installedConnectionConfig = getConnectionConfig();

    // 如果存在，删除老的 connectionItem
    if (connectionItem) {
        const index = installedConnectionConfig.items.indexOf(connectionItem);
        if (index !== -1) {
            installedConnectionConfig.items.splice(index, 1);
        }
    }

    if (data.connectionType === 'STDIO') {
        const connectionItem: IStdioConnectionItem = {
            type: 'stdio',
            name: data.serverInfo.name,
            version: data.serverInfo.version,
            command: data.command,
            args: data.args,
            cwd: data.cwd.replace(/\\/g, '/'),
            env: data.env,
            filePath: absPath.replace(/\\/g, '/')
        };

        console.log('get connectionItem: ', connectionItem);
        

        // 插入到第一个
        installedConnectionConfig.items.unshift(connectionItem);
        saveConnectionConfig();
        vscode.commands.executeCommand('openmcp.sidebar.installed-connection.refresh');

    } else {
        const connectionItem: ISSEConnectionItem = {
            type: 'sse',
            name: data.serverInfo.name,
            version: data.serverInfo.version,
            url: data.url,
            oauth: data.oauth,
            filePath: absPath.replace(/\\/g, '/')
        };

        // 插入到第一个
        installedConnectionConfig.items.unshift(connectionItem);
        saveConnectionConfig();
        vscode.commands.executeCommand('openmcp.sidebar.installed-connection.refresh');
    }
}


function normaliseConnectionFilePath(item: IConnectionItem, workspace: string) {
    if (item.filePath) {
        if (item.filePath.startsWith('{workspace}')) {
            return item.filePath.replace('{workspace}', workspace).replace(/\\/g, '/');
        } else {
            return item.filePath.replace(/\\/g, '/');
        }
    }

    return undefined;
}

export function getWorkspacePath() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return (workspaceFolder?.uri.fsPath || '').replace(/\\/g, '/');
}

/**
 * @description 根据输入的文件路径，获取该文件的 mcp 连接签名
 * @param absPath 
 */
export function getWorkspaceConnectionConfigItemByPath(absPath: string) {
    const workspacePath = getWorkspacePath();
    const workspaceConnectionConfig = getWorkspaceConnectionConfig();

    const normaliseAbsPath = absPath.replace(/\\/g, '/');
    for (const item of workspaceConnectionConfig.items) {
        const filePath = normaliseConnectionFilePath(item, workspacePath);
        if (filePath === normaliseAbsPath) {
            return item;
        }
    }

    return undefined;
}

/**
 * @description 根据输入的文件路径，获取该文件的 mcp 连接签名
 * @param absPath 
 */
export function getInstalledConnectionConfigItemByPath(absPath: string) {
    const installedConnectionConfig = getConnectionConfig();

    const normaliseAbsPath = absPath.replace(/\\/g, '/');
    for (const item of installedConnectionConfig.items) {
        const filePath = (item.filePath || '').replace(/\\/g, '/');
        if (filePath === normaliseAbsPath) {
            return item;
        }
    }

    return undefined;
}


export async function getFirstValidPathFromCommand(command: string, cwd: string): Promise<string | undefined> {
    // 分割命令字符串
    const parts = command.split(' ');
    
    // 遍历命令部分，寻找第一个可能是路径的部分
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        
        // 跳过以 '-' 开头的参数
        if (part.startsWith('-')) continue;
        
        // 处理相对路径
        let fullPath = part;
        if (!fspath.isAbsolute(part)) {
            fullPath = fspath.join(cwd, part);
        }

        console.log(fullPath);

        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    
    return undefined;
}
