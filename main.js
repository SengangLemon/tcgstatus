// 1. 등급 컷라인 테이블
const GRADE_TABLE = [
    { min: 99, grade: "S", color: "border-amber-400 bg-gradient-to-br from-amber-950 to-slate-900 text-amber-200" },
    { min: 97, grade: "A+", color: "border-purple-500 bg-gradient-to-br from-purple-950 to-slate-900 text-purple-200" },
    { min: 90, grade: "A", color: "border-blue-500 bg-gradient-to-br from-blue-950 to-slate-900 text-blue-200" },
    { min: 80, grade: "B", color: "border-emerald-500 bg-gradient-to-br from-emerald-950 to-slate-900 text-emerald-200" },
    { min: 71, grade: "C", color: "border-slate-500 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300" },
    { min: 70, grade: "C-", color: "border-stone-600 bg-slate-900 text-stone-400" },
    { min: 0,  grade: "F", color: "border-red-600 bg-gradient-to-br from-red-950 to-slate-900 text-red-400" },
];

// 2. 카드 렌더링 함수
function renderCard(cardData) {
    const container = document.getElementById('card-container');
    const style = GRADE_TABLE.find(row => cardData.finalScore >= row.min) || GRADE_TABLE[GRADE_TABLE.length - 1];

    container.innerHTML = `
        <div class="w-80 h-[500px] border-4 rounded-2xl p-5 shadow-2xl transition-transform duration-300 hover:scale-105 flex flex-col justify-between ${style.color}">
            
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
                <span class="text-xs font-bold tracking-wider uppercase opacity-70">${cardData.category}</span>
                <span class="text-2xl font-black">${style.grade}</span>
            </div>

            <div class="my-4">
                <h2 class="text-xl font-extrabold truncate text-center">${cardData.name}</h2>
            </div>

            <div class="text-center my-2">
                <div class="inline-block px-5 py-2 bg-black/40 rounded-full font-mono text-3xl font-black tracking-wider">
                    ${cardData.finalScore} <span class="text-sm opacity-50">/ 100</span>
                </div>
            </div>

            <div class="space-y-3 my-4 bg-black/20 p-3 rounded-xl text-xs">
                <div>
                    <div class="flex justify-between font-bold mb-1"><span>핵심 역량 (60%)</span><span>${cardData.groups.A.average}점</span></div>
                    <div class="w-full bg-white/10 h-1.5 rounded-full"><div class="bg-amber-400 h-1.5 rounded-full" style="width: ${cardData.groups.A.average}%"></div></div>
                </div>
                <div>
                    <div class="flex justify-between font-bold mb-1"><span>운영 역량 (30%)</span><span>${cardData.groups.B.average}점</span></div>
                    <div class="w-full bg-white/10 h-1.5 rounded-full"><div class="bg-blue-400 h-1.5 rounded-full" style="width: ${cardData.groups.B.average}%"></div></div>
                </div>
                <div>
                    <div class="flex justify-between font-bold mb-1"><span>부가 매력 (10%)</span><span>${cardData.groups.C.average}점</span></div>
                    <div class="w-full bg-white/10 h-1.5 rounded-full"><div class="bg-purple-400 h-1.5 rounded-full" style="width: ${cardData.groups.C.average}%"></div></div>
                </div>
            </div>

            <div class="text-center text-xs border-t border-white/10 pt-3 opacity-80 italic">
                "${cardData.comment}"
            </div>
        </div>
    `;
}

// 3. 내부 JSON 데이터를 가져와 실행
fetch('tcg-card-sample.json')
    .then(response => response.json())
    .then(data => {
        renderCard(data.card);
    })
    .catch(err => {
        console.error("데이터 로드 실패:", err);
        document.getElementById('card-container').innerHTML = `<p class="text-red-400">데이터를 불러오지 못했습니다.</p>`;
    });
