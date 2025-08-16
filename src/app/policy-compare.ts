import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PolicyCompare {
  comparePolicies(policyA: any, policyB: any): string[] {
    const diffs: string[] = [];
    this.compareNodes(policyA?.authnSelectionTrees?.[0]?.rootNode, policyB?.authnSelectionTrees?.[0]?.rootNode, 'root', diffs);
    return diffs;
  }

  private compareNodes(nodeA: any, nodeB: any, path: string, diffs: string[]): void {
    if (!nodeA && nodeB) {
      diffs.push(`Node missing in A at ${path}, found in B: ${this.describe(nodeB)}`);
      return;
    }
    if (!nodeB && nodeA) {
      diffs.push(`Node missing in B at ${path}, found in A: ${this.describe(nodeA)}`);
      return;
    }
    if (!nodeA || !nodeB) return;

    // Compare properties
    ['type', 'context'].forEach(prop => {
      if (nodeA.action?.[prop] !== nodeB.action?.[prop]) {
        diffs.push(`Difference at ${path}: ${prop} (A=${nodeA.action?.[prop]} | B=${nodeB.action?.[prop]})`);
      }
    });

    if (nodeA.action?.fragment?.id !== nodeB.action?.fragment?.id) {
      diffs.push(`Difference at ${path}: fragment.id (A=${nodeA.action?.fragment?.id} | B=${nodeB.action?.fragment?.id})`);
    }

    if (nodeA.action?.authenticationSelectorRef?.id !== nodeB.action?.authenticationSelectorRef?.id) {
      diffs.push(`Difference at ${path}: selector.id (A=${nodeA.action?.authenticationSelectorRef?.id} | B=${nodeB.action?.authenticationSelectorRef?.id})`);
    }

    // Recurse children
    const childrenA = nodeA.children || [];
    const childrenB = nodeB.children || [];
    const max = Math.max(childrenA.length, childrenB.length);
    for (let i = 0; i < max; i++) {
      this.compareNodes(childrenA[i], childrenB[i], `${path}->child[${i}]`, diffs);
    }
  }

  private describe(node: any): string {
    return `${node?.action?.type || ''} ${node?.action?.fragment?.id || node?.action?.authenticationSelectorRef?.id || ''}`;
  }
}