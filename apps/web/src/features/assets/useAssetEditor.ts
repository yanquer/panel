// 资产编辑状态文件用于管理详情区草稿、脏状态和保存参数，解决列表状态与编辑状态耦合过深的问题。
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Asset, UpdateAssetInput } from '../../api/types';

interface AssetDraft {
  title: string;
  content: string;
}

interface UseAssetEditorResult {
  draft: AssetDraft;
  dirty: boolean;
  isSnippet: boolean;
  reset: () => void;
  save: () => Promise<Asset | null>;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
}

// useAssetEditor 管理当前选中资产的编辑草稿与保存载荷。
export function useAssetEditor(asset: Asset | null, onSave: (assetId: string, input: UpdateAssetInput) => Promise<Asset>): UseAssetEditorResult {
  const baseDraft = useMemo(() => createDraft(asset), [asset]);
  const [draft, setDraft] = useState<AssetDraft>(baseDraft);

  useEffect(() => {
    setDraft(baseDraft);
  }, [baseDraft]);

  const dirty = useMemo(() => hasDraftChanges(baseDraft, draft), [baseDraft, draft]);
  const isSnippet = asset?.kind === 'snippet';

  const setTitle = useCallback((title: string) => {
    setDraft((current) => ({ ...current, title }));
  }, []);

  const setContent = useCallback((content: string) => {
    setDraft((current) => ({ ...current, content }));
  }, []);

  const reset = useCallback(() => {
    setDraft(baseDraft);
  }, [baseDraft]);

  const save = useCallback(async () => {
    if (!asset) {
      return null;
    }
    return onSave(asset.id, createSaveInput(asset, draft));
  }, [asset, draft, onSave]);

  return { draft, dirty, isSnippet, reset, save, setContent, setTitle };
}

// createDraft 根据当前资产生成详情区默认草稿值。
function createDraft(asset: Asset | null): AssetDraft {
  return { title: asset?.title ?? '', content: asset?.textContent ?? '' };
}

// hasDraftChanges 判断当前草稿是否相对初始值发生了修改。
function hasDraftChanges(baseDraft: AssetDraft, draft: AssetDraft): boolean {
  return baseDraft.title !== draft.title || baseDraft.content !== draft.content;
}

// createSaveInput 把详情区草稿转换为编辑接口所需的请求体。
function createSaveInput(asset: Asset, draft: AssetDraft): UpdateAssetInput {
  return asset.kind === 'snippet' ? { title: draft.title, content: draft.content } : { title: draft.title };
}
