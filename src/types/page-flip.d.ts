declare module "page-flip/dist/js/page-flip.module.js" {
  export type PageFlipOrientation = "portrait" | "landscape";

  export interface PageFlipEvent<T> {
    data: T;
    object: PageFlip;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: Record<string, unknown>);
    loadFromHTML(pages: HTMLElement[]): void;
    destroy(): void;
    on<T>(event: string, callback: (event: PageFlipEvent<T>) => void): PageFlip;
    off(event: string): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getOrientation(): PageFlipOrientation;
    getState(): string;
  }
}
