// 上传拖拽区文件用于处理图片和文件输入，解决电脑与手机浏览器的统一上传入口问题。
import { FileUploadController } from './FileUploadController';

interface Props {
  busy: boolean;
  onUpload: (files: FileList | File[]) => Promise<void>;
}

// UploadDropzone 渲染拖拽和点击上传区域。
export function UploadDropzone({ busy, onUpload }: Props): JSX.Element {
  const controller = new FileUploadController({ busy, onUpload });

  return (
    <div className="uploader">
      <span className="meta-label">Air Corridor</span>
      <div className="quick-create__section-head">
        <h2 className="panel__title">拖入图片或文件</h2>
        <p className="panel__description">支持截图、照片、PDF、压缩包与常见文档，上传后会立即出现在中间共享流里。</p>
      </div>
      <label className="dropzone" data-busy={busy} aria-disabled={busy} onDragOver={(event) => controller.handleDragOver(event)} onDrop={(event) => void controller.handleDrop(event)}>
        <input className="dropzone__input" data-testid="quick-create-file-input" multiple type="file" disabled={busy} onChange={(event) => void controller.handleInputChange(event)} />
        <strong>轻点选择，或直接拖进来</strong>
        <span className="muted">界面会自动提取图片尺寸、大小、时间等属性。</span>
      </label>
    </div>
  );
}
