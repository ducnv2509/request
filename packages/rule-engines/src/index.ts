import { Any } from "utils";
import { AST } from "./ast";
import { IEdge, ITicket, IWorkflowDetail } from "entities";

export interface ValidateResponse {
    valid: boolean;
    reason?: string;
    path?: string;
    location?: string;
}
export function isValid(
    source: string,
    name: "before_rule" | "during_rule",
    values: Any
): ValidateResponse {
    const location = name === "before_rule" ? "ticket" : "body";
    try {
        const ast = new AST(source, name);
        const valid = ast.value(values);
        const reason = ast.getReason();
        const path = ast.getPathError();
        return { valid, reason, path, location };
    } catch (error) {
        const e = <Error>error;
        return { valid: false, reason: e.message, location };
    }
}
export function verifyTicketTransistion(
    ticket: ITicket,
    body: Any,
    sourceId: string,
    targetId: string
): ValidateResponse {
    try {
        const workflow: IWorkflowDetail = ticket.workflow;
        const egdes: IEdge[] = workflow.edges;
        let before_rule: string | undefined;
        let during_rule: string | undefined;
        for (const edge of egdes) {
            if (edge.source === sourceId && edge.target === targetId) {
                before_rule = edge.before_rule;
                during_rule = edge.during_rule;
                break;
            }
        }
        let ret: ValidateResponse;
        if (before_rule) {
            ret = isValid(before_rule, "before_rule", ticket);
            if (ret.valid === false) {
                return ret;
            }
        }
        if (during_rule) {
            ret = isValid(during_rule, "during_rule", body);
            if (ret.valid === false) {
                return ret;
            }
        }
        return { valid: true, reason: "OK" };
    } catch (e) {
        return { valid: false, reason: (e as Error).message };
    }
}
