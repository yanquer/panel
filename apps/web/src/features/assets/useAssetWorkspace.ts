// 资产工作区状态文件用于管理列表加载、上传、筛选、选中与管理态交互，解决页面状态分散的问题。
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Asset, AssetKind, UpdateAssetInput } from '../../api/types';
import { createSnippet, deleteAsset, fetchAssets, unlockAdmin, updateAsset, uploadFile } from '../../api/client';
import { copyText } from '../../shared/lib/clipboard';
import type { FeedbackNotice, FeedbackTone } from '../../shared/lib/feedback';

export type AssetFilter = AssetKind | 'all';

interface WorkspaceState {
  items: Asset[];
  loading: boolean;
  busy: boolean;
  filter: AssetFilter;
  selectedId: string | null;
  message: string;
  adminUnlocked: boolean;
  notice: FeedbackNotice | null;
}

// useAssetWorkspace 集中管理页面所需的资产状态和交互动作。
export function useAssetWorkspace() {
  const [state, setState] = useState<WorkspaceState>(createInitialState);

  useEffect(() => {
    void refresh(state.filter);
  }, [state.filter]);

  const selectedAsset = useMemo(() => state.items.find((item) => item.id === state.selectedId) ?? null, [state.items, state.selectedId]);

  // setFilter 切换当前资产过滤维度。
  const setFilter = useCallback((filter: AssetFilter) => {
    setState((current) => ({ ...current, filter }));
  }, []);

  // selectAsset 记录当前详情面板选中的资产。
  const selectAsset = useCallback((assetId: string | null) => {
    setState((current) => ({ ...current, selectedId: assetId }));
  }, []);

  // dismissNotice 清除当前顶部提示。
  const dismissNotice = useCallback(() => {
    setState((current) => (current.notice ? { ...current, notice: null } : current));
  }, []);

  // submitSnippet 提交新的文字便签并刷新列表。
  const submitSnippet = useCallback(async (title: string, content: string) => {
    await runBusyAction('文字已共享到局域网。', async () => {
      const asset = await createSnippet({ title, content });
      await refresh(state.filter);
      setState((current) => ({ ...current, selectedId: asset.id }));
    });
  }, [state.filter]);

  // submitFiles 上传文件集合并刷新当前列表。
  const submitFiles = useCallback(async (files: FileList | File[]) => {
    const entries = Array.from(files);
    await runBusyAction(`已加入 ${entries.length} 个共享项。`, async () => {
      for (const file of entries) {
        await uploadFile(file);
      }
      await refresh(state.filter);
    });
  }, [state.filter]);

  // unlock 进入管理态以允许删除资产。
  const unlock = useCallback(async (password: string) => {
    await runBusyAction('管理模式已解锁。', async () => {
      await unlockAdmin(password);
      setState((current) => ({ ...current, adminUnlocked: true }));
    });
  }, []);

  // remove 删除当前选中资产并重载列表。
  const remove = useCallback(async (assetId: string) => {
    await runBusyAction('共享项已移除。', async () => {
      await deleteAsset(assetId);
      await refresh(state.filter);
    });
  }, [state.filter]);

  // saveAsset 更新当前共享项的标题或便签正文，并同步回列表与详情区。
  const saveAsset = useCallback(async (assetId: string, input: UpdateAssetInput) => {
    return runBusyAction('共享项已更新。', async () => {
      const asset = await updateAsset(assetId, input);
      setState((current) => ({ ...current, items: replaceAsset(current.items, asset), selectedId: asset.id }));
      return asset;
    });
  }, []);

  // copyAsset 复制文字资产内容并写入提示反馈。
  const copyAsset = useCallback(async (asset: Asset) => {
    const text = getAssetCopyText(asset);
    try {
      await copyText(text);
      publishNotice('success', '文字已复制到剪贴板。');
    } catch {
      publishNotice('error', '复制失败，请手动选中文本。');
    }
  }, []);

  return { ...state, selectedAsset, copyAsset, dismissNotice, saveAsset, setFilter, selectAsset, submitSnippet, submitFiles, unlock, remove };

  // refresh 重新加载资产列表并保持当前选中状态尽量稳定。
  async function refresh(filter: AssetFilter) {
    setState((current) => ({ ...current, loading: true }));
    try {
      const items = await fetchAssets(filter);
      setState((current) => ({ ...current, items, loading: false, selectedId: keepSelection(current.selectedId, items) }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, message: getErrorMessage(error) }));
    }
  }

  // runBusyAction 统一处理忙碌状态、成功提示与失败提示。
  async function runBusyAction<T>(successMessage: string, action: () => Promise<T>): Promise<T> {
    setState((current) => ({ ...current, busy: true, message: '正在处理，请稍候…' }));
    try {
      const result = await action();
      setState((current) => ({ ...current, busy: false, message: successMessage }));
      return result;
    } catch (error) {
      setState((current) => ({ ...current, busy: false, message: getErrorMessage(error) }));
      throw error;
    }
  }

  // publishNotice 同步更新顶部提示和页面状态文案。
  function publishNotice(tone: FeedbackTone, message: string): void {
    setState((current) => ({ ...current, message, notice: { tone, message } }));
  }
}

// createInitialState 创建包含本地视图偏好的初始工作区状态。
function createInitialState(): WorkspaceState {
  return {
    items: [],
    loading: true,
    busy: false,
    filter: 'all',
    selectedId: null,
    message: '局域网就绪，拖入内容即可共享。',
    adminUnlocked: false,
    notice: null,
  };
}

// keepSelection 在刷新列表后尽量保留原有选中状态。
function keepSelection(selectedId: string | null, items: Asset[]): string | null {
  if (selectedId && items.some((item) => item.id === selectedId)) {
    return selectedId;
  }
  return items[0]?.id ?? null;
}

// getErrorMessage 把未知异常统一转换为可读提示语。
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请稍后再试';
}

// getAssetCopyText 读取文字资产的复制内容并在空文本时回退标题。
function getAssetCopyText(asset: Asset): string {
  return asset.textContent?.trim() ? asset.textContent : asset.title;
}

// replaceAsset 用最新的资产内容覆盖列表中的旧项并保持顺序不变。
function replaceAsset(items: Asset[], asset: Asset): Asset[] {
  return items.map((item) => (item.id === asset.id ? asset : item));
}
