import { HttpClient, provideHttpClient } from '@angular/common/http';
import { AfterContentInit, AfterViewInit, Component, ElementRef, OnChanges, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as d3 from 'd3';
import { OrgChart } from 'd3-org-chart';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'policy-viewer';
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  private chart!: any;
  private idCounter = 0;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // Load the JSON at runtime (more reliable than TS import across toolchains)
    this.http.get<any>('./assets/Policy.json').subscribe({
      next: (policy) => {
        const flat = this.policyToFlatNodes(policy);
        this.renderChart(flat);
      },
      error: (err) => {
        console.error('Failed to load Policy.json', err);
        // Fallback sample so the chart still renders and proves the pipeline
        const fallback = [
          { id: 'root', parentId: null, label: 'User-Identification', type: 'FRAGMENT' },
          { id: 'fail', parentId: 'root', label: 'Fail', type: 'DONE' },
          { id: 'ff', parentId: 'root', label: 'FF-Authentication', type: 'FRAGMENT' },
          { id: 'fp', parentId: 'root', label: 'ForgotPassword', type: 'AUTH_SELECTOR' },
          { id: 'idfirst', parentId: 'fp', label: 'IdentifierFirst (Yes)', type: 'AUTH_SELECTOR' }
        ];
        this.renderChart(fallback);
      }
    });
  }

  private renderChart(data: any[]): void {
    // d3-org-chart expects unique id & parentId in a FLAT array. Root has parentId = null.
    this.chart = new OrgChart()
      .container(this.chartContainer.nativeElement)
      .data(data)
      .nodeWidth(() => 260)
      .nodeHeight(() => 140)
      .childrenMargin(() => 50)
      .compactMarginBetween(() => 20)
      .compactMarginPair(() => 100)
      .nodeContent((d: any) => {
        const { label, type, fragmentId, context, selectorId } = d.data;
        return `
          <div style="padding:10px; border-radius:10px; background:#f7f7f8; box-shadow:0 2px 6px rgba(0,0,0,0.12);">
            <div style="font-weight:700; margin-bottom:4px;">${label || ''}</div>
            <div><b>Type:</b> ${type || ''}</div>
            ${fragmentId ? `<div><b>Fragment:</b> ${fragmentId}</div>` : ''}
            ${selectorId ? `<div><b>Selector:</b> ${selectorId}</div>` : ''}
            ${context ? `<div><b>Context:</b> ${context}</div>` : ''}
          </div>`;
      })
      .render();

    // Expand after first render to ensure visibility
    setTimeout(() => this.chart.expandAll && this.chart.expandAll(), 0);
  }

  // --- Transform Policy.json to a FLAT array with id/parentId ---
  private policyToFlatNodes(policy: any): any[] {
    const root = policy?.authnSelectionTrees?.[0]?.rootNode;
    const out: any[] = [];
    this.visit(root, null, out);
    return out;
  }

  private visit(node: any, parentId: string | null, out: any[]): void {
    if (!node || !node.action) return;

    const type: string | undefined = node.action.type;
    const fragmentId: string | undefined = node.action.fragment?.id;
    const selectorId: string | undefined = node.action.authenticationSelectorRef?.id;
    const context: string | undefined = node.action.context;

    const id = this.makeId(type, fragmentId, selectorId, context);

    out.push({
      id,
      parentId,
      label: fragmentId || selectorId || type || id,
      type,
      fragmentId,
      selectorId,
      context,
    });

    const children: any[] = Array.isArray(node.children) ? node.children : [];
    for (const child of children) {
      this.visit(child, id, out);
    }
  }

  private makeId(type?: string, fragmentId?: string, selectorId?: string, context?: string): string {
    // Build a stable, unique id and guard against collisions
    const base = [type, fragmentId, selectorId, context].filter(Boolean).join('|');
    this.idCounter += 1;
    return `${base || 'node'}#${this.idCounter}`;
  }
}
