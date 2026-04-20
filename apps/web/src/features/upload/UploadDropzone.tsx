// 上传拖拽区文件用于处理图片和文件输入，解决电脑与手机浏览器的统一上传入口问题。
import { useRef } from 'react';

interface Props {
  busy: boolean;
  onUpload: (files: FileList | File[]) => Promise<void>;
}

// UploadDropzone 渲染拖拽和点击上传区域。
export function UploadDropzone({ busy, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="panel panel--glass">
      <span className="meta-label">Air Corridor</span>
      <div>
        <h2 className="panel__title">拖入图片或文件</h2>
        <p className="panel__description">支持截图、照片、PDF、压缩包与常见文档，上传后会立即出现在中间共享流里。</p>
      </div>
      <button className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={preventDefault} onDrop={(event) => void handleDrop(event, onUpload)}>
        <strong>轻点选择，或直接拖进来</strong>
        <span className="muted">界面会自动提取图片尺寸、大小、时间等属性。</span>
      </button>
      <input ref={inputRef} hidden multiple type="file" disabled={busy} onChange={(event) => void handleChange(event, onUpload)} />
    </section>
  );
}

// preventDefault 阻止浏览器默认拖拽行为以保持页面稳定。
function preventDefault(event: React.DragEvent) {
  event.preventDefault();
}

// handleDrop 读取拖拽文件并转交上传动作。
async function handleDrop(event: React.DragEvent, onUpload: Props['onUpload']) {
  event.preventDefault();
  if (event.dataTransfer.files.length > 0) {
    await onUpload(event.dataTransfer.files);
  }
}

// handleChange 读取文件选择器结果并在存在文件时触发上传。
async function handleChange(event: React.ChangeEvent<HTMLInputElement>, onUpload: Props['onUpload']) {
  if (event.target.files && event.target.files.length > 0) {
    await onUpload(event.target.files);
  }
}
