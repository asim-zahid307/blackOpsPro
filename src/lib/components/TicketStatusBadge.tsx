import {TicketStatus, STATUS_LABELS} from '@/types/ticket';

interface Props {
    status: TicketStatus;
}

const STATUS_STYLES: Record<TicketStatus, string> = {
    open: 'bg-blue-100 text-blue-800',
    investigating: 'bg-yellow-100 text-yellow-800',
    mitigated: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
};

export default function TicketStatusBadge({status}: Props) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
        </span>
    );
}