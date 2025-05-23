<template>
	<div class="connected-status-container"
		id="connected-status-container"
		@click.stop="toggleConnectionPanel()"
		:class="{ 'connected': connectionResult.success }"
	>
		<span class="mcp-server-info">
			<el-tooltip
				class="extra-connect-container"
				effect="dark"
				placement="right"
				:content="fullDisplayServerName"
			>
				<span class="name">{{ displayServerName }}</span>
			</el-tooltip>
		</span>
		<span class="connect-status">
			<span v-if="connectionResult.success">
				<span class="iconfont icon-connect"></span>
				<span class="iconfont icon-dui"></span>
			</span>
			<span v-else>
				<span class="iconfont icon-connect"></span>
				<span class="iconfont icon-cuo"></span>
			</span>
		</span>
			
	</div>
</template>

<script setup lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Connection } from './sidebar';
import { connectionResult } from '@/views/connect/connection';

defineComponent({ name: 'connected' });

const { t } = useI18n();

const fullDisplayServerName = computed(() => {
	return connectionResult.serverInfo.name + '/' + connectionResult.serverInfo.version;
});

const displayServerName = computed(() => {
    const name = connectionResult.serverInfo.name;
    if (name.length <= 3) return name;
    
    // 处理中文混合名称
    const chineseMatch = name.match(/[\u4e00-\u9fa5]/g);
    if (chineseMatch && chineseMatch.length >= 2) {
        return chineseMatch.slice(0, 3).join('');
    }
    
    // 处理各种命名格式
    const words = name
        .replace(/([a-z])([A-Z])/g, '$1 $2')  // 驼峰分割
        .split(/[\s\-_]+/)  // 分割空格、连字符和下划线
        .filter(word => word.length > 0);
    
    if (words.length === 1 && words[0].length > 3) {
        return words[0].substring(0, 3).toUpperCase();
    }
    
    return words
        .map(word => word[0].toUpperCase())
        .slice(0, 3)
        .join('');
});

function toggleConnectionPanel() {
	Connection.showPanel = true;
}

</script>

<style>
.connected .status-circle {
	background-color: var(--el-color-success) !important;
}

.connected .connect-status {
	border: 1px solid var(--el-color-success) !important;
	color: var(--el-color-success) !important;
}

.disconnected-color {
	background-color: var(--main-color);
}

.status-circle {
	height: 12px;
	width: 12px;
	border-radius: 99%;
	background-color: var(--main-color);
	box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

.extra-connect-container {
	user-select: none;
}

.connected-status-container {
    user-select: none;
	display: flex;
	align-items: center;
	width: auto;
	padding: 8px 0;
	flex-direction: column;
	border-radius: 6px;
	transition: background-color 0.3s ease;
}

.connected-status-container .connect-status {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 10px;
	border-radius: .5em;
	padding: 5px 10px;
	width: 30px;
	border: 1px solid var(--main-color);
	color: var(--main-color);
}

.connected-status-container:hover {
	background-color: var(--sidebar-hover);
}


.status-string {
	color: var(--foreground);
	transition: var(--animation-3s);
	font-size: 13px;
	font-weight: 500;
	white-space: nowrap;
	margin-top: 4px;
}

.mcp-server-info {
	display: flex;
	flex-direction: column;
}

.mcp-server-info .name {
	font-size: 14px;
	font-weight: 600;
	width: 30px;
	display: flex;
	align-items: center;
	justify-content: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	background-color: #f39a6d;
	padding: 5px 12px;
	border-radius: .5em;
	color: #1e1e1e;
}

.mcp-server-info .version {
	font-size: 12px;
	font-weight: 400;	
}

</style>