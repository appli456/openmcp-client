<template>
	<div class="sidebar-item-container">
		<div v-for="(item, index) of sidebarItems" :key="index"
			:id="`sidebar-${item.ident}`"
		>
			<el-tooltip :content="t(item.ident)" placement="right">
				<div class="sidebar-option-item" :class="{ 'active': isActive(item.ident) }"
					@click="gotoOption(item.ident)">
					<span :class="`iconfont ${item.icon}`"></span>
				</div>
			</el-tooltip>
		</div>
	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { sidebarItems } from './sidebar';

defineComponent({ name: 'sidebar-item-container' });

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

function isActive(name: string) {
	return route.name === name;
}

function gotoOption(ident: string) {
	router.push('/' + ident);
}

</script>

<style>
.sidebar-item-container {
	display: contents;
}

.sidebar-option-item {
	margin: 7px;
	height: 32px;
	width: fit-content;
	display: flex;
	align-items: center;
	padding: 5px 12px;
	border-radius: 16px;
	transition: var(--animation-3s);
	cursor: pointer;
	border: 1px solid var(--background);
}

.sidebar-option-item:hover {
	border: 1px solid var(--main-color);
	transition: var(--animation-3s);
}

.sidebar-option-item .iconfont {
	margin-top: 2px;
	margin-right: 7px;
	width: 13px;
	display: flex;
	align-content: center;
	font-size: 17px;
}

.sidebar-option-item.active {
	background-color: var(--main-light-color);
	transition: var(--animation-3s);
}
</style>