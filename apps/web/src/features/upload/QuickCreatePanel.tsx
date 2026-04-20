// 快捷新建面板文件用于把便签创建与文件上传收敛到同一弹窗内，解决顶部新增入口需要统一承载两类创建动作的问题。
import { SnippetComposer } from './SnippetComposer';
import { UploadDropzone } from './UploadDropzone';

interface Props {
  busy: boolean;
  onSnippetSubmit: (title: string, content: string) => Promise<void>;
  onUpload: (files: FileList | File[]) => Promise<void>;
}

// QuickCreatePanel 渲染快捷新建弹窗内的便签与上传双入口。
export function QuickCreatePanel({ busy, onSnippetSubmit, onUpload }: Props): JSX.Element {
  return (
    <div className="quick-create">
      <div className="quick-create__tip">
        <span className="meta-label">Quick Create</span>
        <p className="quick-create__lead">在这里可以直接写一段文字，也可以把截图、照片、PDF 或其他文件拖进来，成功后会立即进入共享流。</p>
      </div>
      <div className="quick-create__grid">
        <section className="quick-create__section" aria-label="文字便签创建">
          <SnippetComposer busy={busy} onSubmit={onSnippetSubmit} />
        </section>
        <section className="quick-create__section" aria-label="文件上传创建">
          <UploadDropzone busy={busy} onUpload={onUpload} />
        </section>
      </div>
    </div>
  );
}
