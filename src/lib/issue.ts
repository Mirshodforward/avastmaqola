// Maqolaning portaldagi joyi: son va undagi tartib raqami ("3-son, 12-maqola")

export const ISSUE_MAX = 999;

/** "3-son, 12-maqola"; raqam yo‘q bo‘lsa — "3-son" */
export function issueLabel(issueNo: number, issueSeq: number | null): string {
  return issueSeq ? `${issueNo}-son, ${issueSeq}-maqola` : `${issueNo}-son`;
}
