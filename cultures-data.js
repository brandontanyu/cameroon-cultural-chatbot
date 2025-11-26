// cultures-data.js
const cameroonianCultures = {
    bamileke: {
        name: "Bamileke",
        language: "Medumba",
        marriageSteps: [
            "Knocking on the door (Tso Tso)",
            "Bride price negotiation",
            "Traditional ceremony (Nguon)",
            "Exchange of gifts"
        ],
        traditions: [
            "The groom's family brings palm wine, kola nuts, and traditional fabrics",
            "Bride price includes livestock, money, and symbolic items",
            "Traditional dances like Njang and Mangambeu"
        ]
    },
    bassa: {
        name: "Bassa",
        language: "Bassa",
        marriageSteps: [
            "Introductory visit (Nkuu)",
            "Bride price discussion",
            "Traditional oath taking",
            "Feast celebration"
        ],
        traditions: [
            "Presentation of traditional dishes like Ekwang and Mbongo Tchobi",
            "Use of traditional Bassa attire with specific beadwork",
            "Musical performances with mvet and drums"
        ]
    },
    bakweri: {
        name: "Bakweri",
        language: "Mokpwe",
        marriageSteps: [
            "Family introduction (Lelè)",
            "Bride price payment",
            "Traditional rites (Nganja)",
            "Community celebration"
        ],
        traditions: [
            "Mount Fako cultural elements incorporated",
            "Traditional palm wine ceremony",
            "Leopard society blessings"
        ]
    },
    fulani: {
        name: "Fulani",
        language: "Fulfulde",
        marriageSteps: [
            "Sharo (flogging ritual)",
            "Dowry negotiation",
            "Islamic ceremonies",
            "Traditional Fulani celebrations"
        ],
        traditions: [
            "Sharo test of bravery for groom",
            "Dowry in cattle",
            "Henna ceremonies for bride",
            "Traditional Fulani music and dance"
        ]
    }
    // Add more cultures as needed
};

// export for CommonJS and also provide default shape
module.exports = { cameroonianCultures };
module.exports.default = cameroonianCultures;