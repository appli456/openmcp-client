<template>
    <h3 class="resource-template">
		<code>prompts/list</code>
		<span
			@click="reloadPrompts({ first: false })"
			class="iconfont icon-restart"
		></span>
	</h3>

	<div class="prompt-template-container-scrollbar">
		<el-scrollbar height="500px">
			<div class="prompt-template-container">
				<div
					class="item"
                    :class="{ 'active': props.tabId >= 0 && tabStorage.currentPromptName === template.name }"
					v-for="template of promptsManager.templates"
					:key="template.name"
                    @click="handleClick(template)"
				>
					<span>{{ template.name }}</span>
					<span>{{ template.description || '' }}</span>
				</div>
			</div>
		</el-scrollbar>
	</div>
</template>

<script setup lang="ts">
import { useMessageBridge } from '@/api/message-bridge';
import { CasualRestAPI, PromptTemplate, PromptsListResponse } from '@/hook/type';
import { onMounted, onUnmounted, defineProps, defineEmits, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { promptsManager, PromptStorage } from './prompts';
import { tabs } from '../panel';
import { ElMessage } from 'element-plus';

const bridge = useMessageBridge();
const { t } = useI18n();

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

const emits = defineEmits([ 'prompt-selected' ]);

let tabStorage: PromptStorage;

if (props.tabId >= 0) {
	const tab = tabs.content[props.tabId];
	tabStorage = tab.storage as PromptStorage;
} else {
	tabStorage = reactive({
		currentPromptName: '',
		formData: {},
		lastPromptGetResponse: undefined
	});
}

function reloadPrompts(option: { first: boolean }) {    
    bridge.postMessage({
        command: 'prompts/list'
    });

    if (!option.first) {
        ElMessage({
            message: t('finish-refresh'),
            type: 'success',
			duration: 3000,
			showClose: true,
        });
    }
}

function handleClick(prompt: PromptTemplate) {
    tabStorage.currentPromptName = prompt.name;
    tabStorage.lastPromptGetResponse = undefined;

    emits('prompt-selected', prompt);
}

let commandCancel: (() => void);

onMounted(() => {
    commandCancel = bridge.addCommandListener('prompts/list', (data: CasualRestAPI<PromptsListResponse>) => {
		promptsManager.templates = data.msg.prompts || [];

		const targetPrompt = promptsManager.templates.find(template => template.name === tabStorage.currentPromptName);

        if (targetPrompt === undefined) {
            tabStorage.currentPromptName = promptsManager.templates[0].name;
            tabStorage.lastPromptGetResponse = undefined;
        }
	}, { once: false });

    reloadPrompts({ first: true });
});

onUnmounted(() => {
    if (commandCancel){
        commandCancel();
    }
})

</script>

<style>
.prompt-template-container-scrollbar {
	background-color: var(--background);
    margin-bottom: 10px;
	border-radius: .5em;
}

.prompt-template-container {
	height: fit-content;
	display: flex;
	flex-direction: column;
	padding: 10px;
}

.prompt-template-function-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.prompt-template-function-container button {
    width: 175px;
}

.prompt-template-container > .item {
	margin: 3px;
	padding: 5px 10px;
	border-radius: .3em;
	user-select: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: var(--animation-3s);
}

.prompt-template-container > .item:hover {
	background-color: var(--main-light-color);
	transition: var(--animation-3s);
}

.prompt-template-container > .item.active {
	background-color: var(--main-light-color);
	transition: var(--animation-3s);
}

.prompt-template-container > .item > span:first-child {
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.prompt-template-container > .item > span:last-child {
	opacity: 0.6;
	font-size: 12.5px;
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>