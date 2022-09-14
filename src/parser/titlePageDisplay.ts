export interface TitleKeywordFormat {
    position: 'cc' | 'br' | 'bl' | 'tr' | 'tc' | 'tl' | 'cc' | 'hidden',
    index: number
}

export const titlePageDisplay: { [index: string]: TitleKeywordFormat } = {
    title: { position: 'cc', index: 0 },
    credit: { position: 'cc', index: 1 },
    author: { position: 'cc', index: 2 },
    authors: { position: 'cc', index: 3 },
    source: { position: 'cc', index: 4 },

    watermark: { position: 'hidden', index: -1 },
    font: { position: 'hidden', index: -1 },
    header: { position: 'hidden', index: -1 },
    footer: { position: 'hidden', index: -1 },

    notes: { position: 'bl', index: 0 },
    copyright: { position: 'bl', index: 1 },

    revision: { position: 'br', index: 0 },
    date: { position: 'br', index: 1 },
    draft_date: { position: 'br', index: 2 },
    contact: { position: 'br', index: 3 },
    contact_info: { position: 'br', index: 4 },


    br: { position: 'br', index: -1 },
    bl: { position: 'bl', index: -1 },
    tr: { position: 'tr', index: -1 },
    tc: { position: 'tc', index: -1 },
    tl: { position: 'tl', index: -1 },
    cc: { position: 'cc', index: -1 }
}