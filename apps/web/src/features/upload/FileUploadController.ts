// 文件上传控制器用于统一处理点击选择和拖拽上传，解决上传事件分散导致失败难定位和异常未消费的问题。
import type React from 'react';

interface FileUploadControllerOptions {
  busy: boolean;
  onUpload: (files: FileList | File[]) => Promise<void>;
}

// FileUploadController 封装上传区域的文件选择、拖拽和异常消费流程。
export class FileUploadController {
  private readonly busy: boolean;
  private readonly onUpload: (files: FileList | File[]) => Promise<void>;

  // constructor 注入上传忙碌态与提交函数，让控制器只负责事件编排。
  constructor(options: FileUploadControllerOptions) {
    this.busy = options.busy;
    this.onUpload = options.onUpload;
  }

  // handleDragOver 阻止浏览器打开文件并标记当前区域可接收复制拖放。
  handleDragOver(event: React.DragEvent<HTMLElement>): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = this.busy ? 'none' : 'copy';
  }

  // handleDrop 读取拖拽文件并提交上传，同时吞掉已展示给用户的异常。
  async handleDrop(event: React.DragEvent<HTMLElement>): Promise<void> {
    event.preventDefault();
    if (this.busy) {
      console.info('[upload] 忙碌态跳过拖拽上传');
      return;
    }
    await this.submitFiles(event.dataTransfer.files, 'drop');
  }

  // handleInputChange 读取系统文件选择器结果并在结束后重置 input。
  async handleInputChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    try {
      await this.submitFiles(event.target.files, 'picker');
    } finally {
      event.target.value = '';
    }
  }

  // submitFiles 校验文件集合并调用上层上传动作，失败时记录日志但不制造未处理 Promise。
  private async submitFiles(files: FileList | File[] | null, source: 'drop' | 'picker'): Promise<void> {
    const entries = files ? Array.from(files) : [];
    if (this.busy || entries.length === 0) {
      console.info('[upload] 跳过空上传', { source, busy: this.busy, count: entries.length });
      return;
    }
    console.info('[upload] 开始上传文件', { source, count: entries.length, names: entries.map((file) => file.name) });
    try {
      await this.onUpload(entries);
    } catch (error) {
      console.error('[upload] 上传失败', { source, error });
    }
  }
}
