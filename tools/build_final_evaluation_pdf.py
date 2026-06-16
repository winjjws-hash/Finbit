from __future__ import annotations

import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs"
ASSET_DIR = ROOT / "docs" / "final-assets"
PDF_PATH = OUT_DIR / "Energy_Budget_Final_Evaluation_Presentation.pdf"

FONT_REGULAR = "Malgun"
FONT_BOLD = "MalgunBold"

NAVY = colors.HexColor("#07111F")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#667085")
LINE = colors.HexColor("#D9E2EF")
BLUE = colors.HexColor("#2F6FED")
CYAN = colors.HexColor("#28D6C6")
YELLOW = colors.HexColor("#FFC83D")
GREEN = colors.HexColor("#20C997")
SOFT = colors.HexColor("#F4F7FB")
CARD = colors.HexColor("#FFFFFF")
DEEP_CARD = colors.HexColor("#111B2B")


def setup_fonts() -> None:
    regular = Path("C:/Windows/Fonts/malgun.ttf")
    bold = Path("C:/Windows/Fonts/malgunbd.ttf")
    if regular.exists():
        pdfmetrics.registerFont(TTFont(FONT_REGULAR, str(regular)))
    if bold.exists():
        pdfmetrics.registerFont(TTFont(FONT_BOLD, str(bold)))


def sw(text: str, font: str, size: int) -> float:
    return pdfmetrics.stringWidth(text, font, size)


def wrap_text(text: str, font: str, size: int, max_width: float) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        words = paragraph.split(" ")
        line = ""
        for word in words:
            candidate = word if not line else f"{line} {word}"
            if sw(candidate, font, size) <= max_width:
                line = candidate
                continue
            if line:
                lines.append(line)
                line = word
            else:
                chunk = ""
                for ch in word:
                    candidate_chunk = chunk + ch
                    if sw(candidate_chunk, font, size) <= max_width:
                        chunk = candidate_chunk
                    else:
                        if chunk:
                            lines.append(chunk)
                        chunk = ch
                line = chunk
        if line:
            lines.append(line)
    return lines


def draw_wrapped(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    max_width: float,
    *,
    font: str = FONT_REGULAR,
    size: int = 16,
    color=INK,
    leading: float | None = None,
    max_lines: int | None = None,
) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    line_h = leading or size * 1.45
    lines = wrap_text(text, font, size, max_width)
    if max_lines is not None:
        lines = lines[:max_lines]
    for line in lines:
        c.drawString(x, y, line)
        y -= line_h
    return y


def rounded(c: canvas.Canvas, x: float, y: float, w: float, h: float, r: float, fill, stroke=None, lw=1):
    c.saveState()
    c.setFillColor(fill)
    if stroke is None:
        c.setStrokeColor(fill)
    else:
        c.setStrokeColor(stroke)
    c.setLineWidth(lw)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1 if stroke else 0)
    c.restoreState()


def pill(c: canvas.Canvas, x: float, y: float, text: str, fill, fg, font=FONT_BOLD, size=12, pad_x=13):
    w = sw(text, font, size) + pad_x * 2
    h = size + 12
    rounded(c, x, y, w, h, h / 2, fill)
    c.setFont(font, size)
    c.setFillColor(fg)
    c.drawString(x + pad_x, y + 7, text)
    return w


def header(c: canvas.Canvas, title: str, label: str, page_no: int) -> None:
    w, h = landscape(A4)
    c.setFillColor(NAVY)
    c.rect(0, h - 10, w, 10, fill=1, stroke=0)
    c.setFont(FONT_BOLD, 13)
    c.setFillColor(CYAN)
    c.drawString(42, h - 38, label.upper())
    c.setFont(FONT_BOLD, 22)
    c.setFillColor(INK)
    c.drawString(42, h - 68, title)
    c.setFont(FONT_REGULAR, 10)
    c.setFillColor(MUTED)
    c.drawRightString(w - 42, 24, f"Energy Budget | {page_no}")


def image_fit(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float) -> None:
    if not path.exists():
        rounded(c, x, y, w, h, 18, colors.HexColor("#EEF3F8"), LINE)
        draw_wrapped(c, f"이미지 없음: {path.name}", x + 20, y + h / 2, w - 40, size=12, color=MUTED)
        return
    img = ImageReader(str(path))
    iw, ih = img.getSize()
    scale = min(w / iw, h / ih)
    nw, nh = iw * scale, ih * scale
    c.drawImage(img, x + (w - nw) / 2, y + (h - nh) / 2, nw, nh, preserveAspectRatio=True, mask="auto")


def bullet(c: canvas.Canvas, text: str, x: float, y: float, max_width: float, *, color=INK, size=15, accent=CYAN):
    c.setFillColor(accent)
    c.circle(x + 5, y + 5, 4, fill=1, stroke=0)
    return draw_wrapped(c, text, x + 18, y, max_width - 18, size=size, color=color, leading=size * 1.45)


def table(
    c: canvas.Canvas,
    x: float,
    y: float,
    widths: list[float],
    rows: list[list[str]],
    row_h: float,
    header_fill=DEEP_CARD,
    body_size: int = 9,
    header_size: int = 10,
):
    total = sum(widths)
    for r, row in enumerate(rows):
        fill = header_fill if r == 0 else (colors.HexColor("#F8FAFC") if r % 2 == 0 else colors.white)
        fg = colors.white if r == 0 else INK
        rounded(c, x, y - row_h, total, row_h, 0, fill, LINE, 0.6)
        cx = x
        for i, cell in enumerate(row):
            c.setStrokeColor(LINE)
            c.line(cx, y - row_h, cx, y)
            draw_wrapped(
                c,
                cell,
                cx + 7,
                y - 17,
                widths[i] - 14,
                font=FONT_BOLD if r == 0 else FONT_REGULAR,
                size=header_size if r == 0 else body_size,
                color=fg,
                leading=(header_size if r == 0 else body_size) + 3,
                max_lines=3,
            )
            cx += widths[i]
        c.line(x + total, y - row_h, x + total, y)
        y -= row_h
    return y


def progress_bar(c: canvas.Canvas, x: float, y: float, w: float, pct: int, fill=BLUE):
    rounded(c, x, y, w, 8, 4, colors.HexColor("#E7EEF8"))
    rounded(c, x, y, w * pct / 100, 8, 4, fill)


def draw_mermaid_box(c: canvas.Canvas, x: float, y: float, text: str, sub: str, w: float, color):
    rounded(c, x, y, w, 54, 13, colors.HexColor("#0F1A2B"), color, 1.5)
    c.setFont(FONT_BOLD, 15)
    c.setFillColor(colors.white)
    c.drawString(x + 18, y + 31, text)
    c.setFont(FONT_REGULAR, 11)
    c.setFillColor(colors.HexColor("#B8C6D8"))
    c.drawString(x + 18, y + 13, sub)


def slide_cover(c: canvas.Canvas):
    w, h = landscape(A4)
    c.setFillColor(NAVY)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(CYAN)
    c.rect(0, h - 12, w, 12, fill=1, stroke=0)
    pill(c, 58, h - 98, "FINAL PRESENTATION", CYAN, NAVY, size=13)
    c.setFont(FONT_BOLD, 54)
    c.setFillColor(colors.white)
    c.drawString(58, h - 175, "Energy Budget")
    draw_wrapped(
        c,
        "Energy Budget은 오늘 내 컨디션과 남은 에너지를 먼저 계산해서, 지금 할 일과 미뤄도 되는 일을 나눠주는 계획 앱입니다.",
        62,
        h - 218,
        450,
        font=FONT_BOLD,
        size=20,
        color=colors.HexColor("#DCE7F5"),
        leading=30,
    )
    rounded(c, 60, 86, 420, 96, 24, colors.HexColor("#111B2B"), colors.HexColor("#2A3950"), 1)
    draw_wrapped(c, "2024136064 정원식", 90, 142, 360, font=FONT_BOLD, size=24, color=colors.white)
    draw_wrapped(c, "React Native + Expo + TypeScript", 90, 108, 360, size=14, color=colors.HexColor("#B8C6D8"))
    image_fit(c, ASSET_DIR / "app-current.png", 555, 42, 230, 480)
    c.showPage()


def build() -> None:
    setup_fonts()
    OUT_DIR.mkdir(exist_ok=True)
    ASSET_DIR.mkdir(exist_ok=True)
    c = canvas.Canvas(str(PDF_PATH), pagesize=landscape(A4))
    page = 1

    slide_cover(c)
    page += 1

    # 2. Rubric map
    header(c, "평가 기준 대응표", "Checklist", page)
    rows = [
        ["평가 영역", "PDF에서 보여주는 내용", "발표에서 말할 핵심"],
        ["발표 체계성 10점", "완료: 비전, 문제 정의, WBS, 기술, 구현, 활용 흐름", "왜 만들었고 어떻게 만들었는지 순서대로 설명"],
        ["질의응답 5점", "완료: ADR 4개, 앱 구조, 개발 환경, 빌드/배포 단계", "선택 이유를 기록 기준으로 답변"],
        ["개발자 기본소양 10점", "완료: 기술 설명, 아키텍처, 시행착오, 테스트, 코드 품질", "읽지 않고 이해한 내용으로 설명"],
        ["시연 데모 5점", "완료: 30초 데모 순서, 앱 화면, 핵심 기능, 임팩트 포인트", "사용자가 실제로 쓰는 장면처럼 보여주기"],
    ]
    table(c, 56, 420, [130, 330, 280], rows, 58)
    rounded(c, 56, 76, 728, 92, 20, colors.HexColor("#E9FFFB"), colors.HexColor("#B8EFE8"), 1)
    draw_wrapped(
        c,
        "발표 운영: PC에서 GitHub Pages PDF를 먼저 열고, 스마트폰 알람을 5분으로 맞춘 뒤 시작한다. "
        "구성은 '비전 - 문제 - WBS - 구현 - 검증 - 활용 - Q&A' 순서로 진행한다.",
        84,
        130,
        674,
        font=FONT_BOLD,
        size=15,
        color=colors.HexColor("#08766C"),
    )
    c.showPage()
    page += 1

    # 3. Vision
    header(c, "비전: 시간을 채우는 앱이 아니라, 나를 지키는 계획 앱", "Vision", page)
    rounded(c, 56, 300, 730, 140, 28, NAVY)
    draw_wrapped(
        c,
        "Energy Budget은 사람들의 하루 계획을 시간 중심에서 에너지 중심으로 바꾸어, "
        "무리하지 않아도 꾸준히 성장할 수 있는 지속 가능한 일상을 만드는 앱이다.",
        90,
        390,
        650,
        font=FONT_BOLD,
        size=24,
        color=colors.white,
        leading=35,
    )
    y = 250
    y = bullet(c, "목표: 사용자가 오늘 감당 가능한 일을 먼저 알고, 무리한 계획을 줄이게 한다.", 70, y, 700)
    y = bullet(c, "영향: 계획 실패를 자책으로 끝내지 않고, 컨디션 기반 조절로 다시 시작하게 만든다.", 70, y - 10, 700)
    y = bullet(c, "가치: 더 많이 시키는 도구가 아니라 오래 지속할 수 있는 하루를 설계하는 도구다.", 70, y - 10, 700)
    bullet(c, "미래지향성: 기록이 쌓이면 요일별 에너지 패턴과 과제 과부하를 예측하는 앱으로 확장한다.", 70, y - 10, 700)
    c.showPage()
    page += 1

    # 4. Problem
    header(c, "문제 정의: 계획 실패는 의지 부족이 아니라 과부하 설계 문제", "Problem", page)
    left_x = 56
    right_x = 452
    rounded(c, left_x, 105, 350, 330, 24, colors.white, LINE)
    rounded(c, right_x, 105, 335, 330, 24, colors.HexColor("#FFF7DD"), colors.HexColor("#FFE6A3"))
    draw_wrapped(c, "기존 투두앱의 한계", left_x + 28, 385, 290, font=FONT_BOLD, size=22)
    y = 335
    for text in [
        "할 일을 많이 담는 데 집중한다.",
        "시간은 보지만 피로도와 기분은 잘 보지 않는다.",
        "계획이 밀리면 사용자는 정리보다 부담을 먼저 느낀다.",
    ]:
        y = bullet(c, text, left_x + 32, y, 285, size=14, accent=BLUE) - 8
    draw_wrapped(c, "Energy Budget의 관점", right_x + 28, 385, 280, font=FONT_BOLD, size=22)
    y = 335
    for text in [
        "시간보다 먼저 오늘의 에너지를 계산한다.",
        "피로도, 기분, 남은 시간을 계획의 첫 입력값으로 둔다.",
        "감당 가능한 일과 미뤄도 되는 일을 나눠 과부하를 줄인다.",
    ]:
        y = bullet(c, text, right_x + 32, y, 280, size=14, accent=YELLOW) - 8
    rounded(c, 56, 44, 730, 40, 18, colors.HexColor("#E9FFFB"))
    draw_wrapped(c, "공감 문장: 시간은 남았는데 몸이 안 따라와서 계획이 무너지는 순간을 해결한다.", 84, 68, 680, font=FONT_BOLD, size=14, color=colors.HexColor("#08766C"))
    c.showPage()
    page += 1

    # 5. Product flow
    header(c, "제품 흐름: 오늘 상태를 입력하면 할 일을 다시 정리한다", "Product", page)
    steps = [
        ("1", "INPUT", "피로도, 기분, 남은 시간, 닉네임, 날짜별 계획을 입력"),
        ("2", "BUDGET", "오늘 감당 가능한 에너지 예산을 계산"),
        ("3", "RECOMMEND", "지금 하면 좋은 일과 나중으로 미룰 일을 분리"),
        ("4", "REMIND", "마감 3시간 전과 1시간 전 알림 현황을 표시"),
    ]
    y = 385
    for num, title, desc in steps:
        rounded(c, 65, y - 25, 72, 58, 16, CYAN if num != "4" else YELLOW)
        c.setFont(FONT_BOLD, 24)
        c.setFillColor(NAVY)
        c.drawCentredString(101, y - 2, num)
        c.setFont(FONT_BOLD, 18)
        c.setFillColor(CYAN if num != "4" else colors.HexColor("#D39000"))
        c.drawString(160, y + 5, title)
        draw_wrapped(c, desc, 160, y - 21, 330, size=13, color=MUTED)
        y -= 82
    image_fit(c, ASSET_DIR / "app-current.png", 548, 48, 210, 420)
    c.showPage()
    page += 1

    # 6. Demo
    header(c, "30초 시연 데모: 사용자가 실제로 쓰는 흐름으로 보여주기", "Demo", page)
    demo_rows = [
        ["순서", "보여줄 행동", "말할 포인트"],
        ["1", "닉네임 입력", "개인 계획이 날짜별로 저장되는 앱이라는 점"],
        ["2", "피로도와 남은 시간 조절", "오늘의 컨디션이 계획의 기준이 됨"],
        ["3", "할 일 추가: 시간, 날짜, 마감 시간, 에너지 소모 입력", "일마다 에너지 비용을 붙임"],
        ["4", "자동 추천 선택", "앱이 지금 할 일과 미룰 일을 나눔"],
        ["5", "달력과 알림 현황 확인", "과제가 많은 날과 마감 알림을 확인"],
    ]
    table(c, 56, 420, [58, 250, 420], demo_rows, 56)
    rounded(c, 80, 55, 680, 64, 20, NAVY)
    draw_wrapped(c, "시연 임팩트: '할 일을 더 넣는 앱'이 아니라 '오늘 못 해도 괜찮은 일을 골라주는 앱'으로 보여준다.", 112, 93, 616, font=FONT_BOLD, size=15, color=colors.white)
    c.showPage()
    page += 1

    # 7. WBS progress
    header(c, "WBS 진행 현황: 평가 기준 발표 준비 전체 완료", "WBS", page)
    wbs = [
        ("10주차", "기획과 문제 정의", 100, "비전, 사용자 시나리오, MoSCoW, WBS"),
        ("11주차", "설계와 환경 구축", 100, "ADR, 아키텍처, Expo, GitHub Pages"),
        ("12주차", "핵심 입력 기능", 100, "컨디션, 할 일, 날짜, 에너지 소모 입력"),
        ("13주차", "계산과 추천 기능", 100, "에너지 예산, 과부하 판단, 추천/미루기 분리"),
        ("14주차", "기록과 알림 확장", 100, "날짜별 저장, 월간 달력, 알림 현황 완료"),
        ("15주차", "테스트와 최종 발표", 100, "PDF, 데모, README, AGENTS, 배포 가이드 완료"),
    ]
    y = 390
    for week, goal, pct, output in wbs:
        rounded(c, 60, y - 18, 720, 48, 16, colors.white, LINE)
        c.setFont(FONT_BOLD, 15)
        c.setFillColor(BLUE if pct == 100 else CYAN)
        c.drawString(84, y, week)
        c.setFont(FONT_BOLD, 17)
        c.setFillColor(INK)
        c.drawString(165, y, goal)
        progress_bar(c, 370, y + 2, 180, pct, BLUE if pct == 100 else CYAN)
        c.setFont(FONT_BOLD, 13)
        c.setFillColor(INK)
        c.drawRightString(590, y - 1, f"{pct}%")
        draw_wrapped(c, output, 610, y + 4, 150, size=10, color=MUTED, leading=12, max_lines=2)
        y -= 58
    c.showPage()
    page += 1

    # 8. WBS detail
    header(c, "FM WBS: 산출물 중심으로 쪼개고, 완료 기준을 붙였다", "WBS Detail", page)
    rows = [
        ["WBS", "작업", "Owner", "상태", "산출물/완료 기준"],
        ["1", "기획", "정원식", "완료", "비전, 문제 정의, 사용자 시나리오, MoSCoW"],
        ["2", "설계", "정원식", "완료", "ADR 4개, Mermaid 아키텍처, 디렉토리 구조"],
        ["3", "핵심 입력", "정원식", "완료", "피로도, 기분, 남은 시간, 할 일, 날짜, 에너지 소모"],
        ["4", "추천 로직", "정원식", "완료", "에너지 예산 계산, 지금 할 일/미룰 일 분리"],
        ["5", "기록/알림", "정원식", "완료", "날짜별 저장, 월간 보기, 마감 알림 현황"],
        ["6", "검증/발표", "정원식", "완료", "typecheck, test, 데모 시나리오, 최종 평가 PDF"],
    ]
    table(c, 50, 425, [55, 130, 70, 70, 390], rows, 43)
    wbs_img = ROOT / "outputs" / "energy-budget-rebuild" / "wbs-preview.png"
    rounded(c, 110, 42, 620, 64, 18, colors.HexColor("#F8FAFC"), LINE)
    image_fit(c, wbs_img, 132, 53, 576, 42)
    c.showPage()
    page += 1

    # 9. Tech
    header(c, "적용 기술: 모바일 MVP를 빠르게 만들고 설명 가능하게 구성", "Tech Stack", page)
    techs = [
        ("React Native", "모바일 앱 UI를 구성. 웹 미리보기로 발표 중 빠른 확인 가능."),
        ("Expo", "복잡한 네이티브 설정 없이 실행, Android/Web export 검증 가능."),
        ("TypeScript", "데이터 타입을 명확히 해서 입력값과 계산 로직 오류를 줄임."),
        ("AsyncStorage", "현재 MVP의 닉네임, 날짜별 계획, 알림 설정을 로컬 저장."),
        ("Notification API", "마감 3시간 전/1시간 전 알림 현황을 앱 내부에서 표시."),
        ("GitHub Pages", "발표자료와 WBS를 URL로 바로 열 수 있게 준비."),
        ("Mermaid", "아키텍처 흐름을 텍스트 기반 다이어그램으로 표현."),
    ]
    x, y = 56, 380
    for i, (name, desc) in enumerate(techs):
        col = i % 2
        row = i // 2
        bx = x + col * 370
        by = y - row * 86
        rounded(c, bx, by - 34, 335, 66, 16, colors.white, LINE)
        c.setFont(FONT_BOLD, 15)
        c.setFillColor(BLUE if i % 2 == 0 else colors.HexColor("#08766C"))
        c.drawString(bx + 18, by + 8, name)
        draw_wrapped(c, desc, bx + 18, by - 12, 298, size=10, color=MUTED, leading=13, max_lines=3)
    c.showPage()
    page += 1

    # 10. Architecture
    header(c, "아키텍처: 화면과 계산 규칙을 분리해서 설명 가능한 구조로 만들었다", "Architecture", page)
    draw_mermaid_box(c, 72, 360, "사용자", "피로도, 기분, 시간, 할 일을 입력", 300, CYAN)
    draw_mermaid_box(c, 72, 282, "presentation", "HomeScreen, 모바일 UI, 입력 폼", 300, CYAN)
    draw_mermaid_box(c, 72, 204, "application", "화면 흐름과 view model", 300, BLUE)
    draw_mermaid_box(c, 72, 126, "domain", "에너지 예산 계산, 추천 규칙", 300, YELLOW)
    draw_mermaid_box(c, 72, 48, "data", "AsyncStorage 저장, Repository", 300, GREEN)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2)
    for yy in [336, 258, 180, 102]:
        c.line(222, yy, 222, yy - 24)
    rounded(c, 430, 75, 330, 320, 24, colors.white, LINE)
    draw_wrapped(c, "디렉토리 구조", 460, 350, 280, font=FONT_BOLD, size=20)
    tree = (
        "src/presentation  - 사용자가 보는 화면\n"
        "src/application   - 화면 흐름과 use case\n"
        "src/domain        - 핵심 엔티티와 계산 규칙\n"
        "src/data          - 저장소와 Repository\n"
        "docs              - 발표, 배포, 테스트 문서\n"
        ".planning         - 비전, 요구사항, WBS, ADR"
    )
    draw_wrapped(c, tree, 460, 310, 280, font=FONT_REGULAR, size=12, color=INK, leading=24)
    c.showPage()
    page += 1

    # 11. Implementation
    header(c, "구현 설명: 감정적인 문제를 계산 가능한 흐름으로 바꿨다", "Implementation", page)
    impl = [
        ("상태 입력", "피로도, 기분, 남은 시간, 닉네임, 선택 날짜를 React 상태로 관리한다."),
        ("도메인 계산", "calculateEnergyBudget이 컨디션 값을 에너지 예산으로 바꾸고, 총 소모량과 비교한다."),
        ("추천 분리", "할 일의 에너지 소모가 예산 안에 들어오면 지금 할 일, 넘치면 미루기 후보로 분리한다."),
        ("수정 가능성", "할 일 추가 후 제목, 카테고리, 날짜, 마감 시간, 에너지 소모를 수정할 수 있게 했다."),
        ("요일 저장", "날짜별 계획을 로컬 저장해 월간 달력에서 과제가 많은 날을 확인할 수 있게 했다."),
        ("알림 현황", "마감까지 3시간/1시간 남은 일을 앱 상단에서 먼저 보여준다."),
    ]
    y = 384
    for title, desc in impl:
        rounded(c, 68, y - 23, 704, 48, 15, colors.white, LINE)
        c.setFont(FONT_BOLD, 14)
        c.setFillColor(CYAN)
        c.drawString(92, y + 2, title)
        draw_wrapped(c, desc, 205, y + 4, 520, size=11, color=INK, leading=14, max_lines=2)
        y -= 58
    c.showPage()
    page += 1

    # 12. ADR
    header(c, "ADR 최소 3개 이상: 선택 이유를 기록으로 답변한다", "ADR", page)
    rows = [
        ["ADR", "결정", "이유", "질문 답변 포인트"],
        ["0001", "React Native + Expo", "모바일 사용성이 중요하고 6주 안에 MVP 구현 가능", "왜 모바일인가? 생활 속에서 자주 확인해야 하기 때문"],
        ["0002", "React 기본 상태 + 도메인 분리", "초기 화면 수가 적고 계산 규칙을 따로 설명하기 쉬움", "왜 Redux가 아닌가? MVP에는 과함"],
        ["0003", "초기 로컬 저장", "계정/서버 없이도 핵심 가치 검증 가능", "DB는 다음 확장, 현재는 AsyncStorage 중심"],
        ["0004", "Energy Budget 주제", "실생활 사용성과 발표/포트폴리오 설명력이 높음", "왜 이 주제인가? 공감 가능한 문제와 구현 범위가 맞음"],
    ]
    table(c, 45, 422, [58, 150, 280, 250], rows, 64)
    rounded(c, 70, 50, 700, 62, 18, colors.HexColor("#E9FFFB"))
    draw_wrapped(c, "Q&A 원칙: 외운 답보다 ADR의 '상황 - 결정 - 이유 - 결과' 순서로 답한다.", 96, 86, 650, font=FONT_BOLD, size=15, color=colors.HexColor("#08766C"))
    c.showPage()
    page += 1

    # 13. Environment build deploy
    header(c, "개발 환경, 빌드, 배포: 실행 가능한 산출물로 검증", "Build & Deploy", page)
    rows = [
        ["구분", "명령/산출물", "의미"],
        ["설치", "npm install", "프로젝트 의존성을 내려받아 같은 환경을 만든다."],
        ["개발 실행", "npm run start / npm run web", "Expo 개발 서버를 열고 모바일 UI를 확인한다."],
        ["정적 검사", "npm run typecheck", "TypeScript 기준으로 코드 오류를 먼저 확인한다."],
        ["Android export", "npm run export:android", "Android용 번들 생성 가능성을 검증한다."],
        ["Web export", "npm run export:web", "PC 브라우저 백업 실행과 Pages 배포 자료를 만든다."],
        ["GitHub Pages", "발표 PDF + WBS URL", "발표 시작 지연 없이 PC에서 바로 열 수 있게 한다."],
    ]
    table(c, 58, 440, [120, 240, 360], rows, 57, body_size=12, header_size=12)
    c.showPage()
    page += 1

    # 14. Engineering quality
    header(c, "개발자 기본소양: 이해, 개선, 검증을 함께 보여준다", "Engineering", page)
    cards = [
        ("시행착오", "처음에는 기능을 많이 넣으려 했지만, WBS와 MoSCoW로 MVP 범위를 줄였다."),
        ("성능 최적화", "계산 로직은 입력이 바뀔 때만 다시 계산하고, 화면은 모바일 폭에 맞춰 과한 여백을 줄였다."),
        ("코드 품질", "TypeScript 타입, 도메인 규칙 분리, Repository 구조로 화면과 계산을 분리했다."),
        ("단위 테스트 관점", "energyBudgetRules의 예산 계산, 총 소모량, 과부하 판단을 독립적으로 검증 대상으로 잡았다."),
        ("통합 테스트 관점", "컨디션 입력 - 할 일 추가 - 추천 분리 - 저장 - 달력 확인 흐름을 사용자 시나리오로 확인했다."),
        ("설치 가이드", "README, docs/setup.md, docs/deploy.md에 실행과 배포 방법을 정리했다."),
    ]
    x0, y0 = 56, 365
    for i, (title, body) in enumerate(cards):
        col = i % 2
        row = i // 2
        x = x0 + col * 370
        y = y0 - row * 105
        rounded(c, x, y - 50, 335, 86, 18, colors.white, LINE)
        c.setFont(FONT_BOLD, 15)
        c.setFillColor(BLUE if col == 0 else colors.HexColor("#08766C"))
        c.drawString(x + 18, y + 10, title)
        draw_wrapped(c, body, x + 18, y - 12, 295, size=11, color=MUTED, leading=14, max_lines=3)
    c.showPage()
    page += 1

    # 15. Q&A answers
    header(c, "예상 질문 답변: ADR 기준으로 짧고 정확하게", "Q&A Prep", page)
    qa = [
        ("Q1. DB도 만들었나요?", "현재 MVP는 AsyncStorage로 날짜별 계획을 저장합니다. SQLite는 다음 단계이며, ADR-0003에서 서버 없이 먼저 핵심 가치를 검증하기로 기록했습니다."),
        ("Q2. 앱 구조는 어떻게 되나요?", "presentation은 화면, application은 흐름, domain은 계산 규칙, data는 저장 역할입니다. 화면과 계산을 분리해서 수정과 설명이 쉽습니다."),
        ("Q3. 왜 Expo를 썼나요?", "6주 안에 모바일 MVP를 만들고 Android/Web export를 빠르게 검증하기 위해서입니다. 네이티브 기능이 많지 않아 Expo가 적합했습니다."),
        ("Q4. 빌드와 배포는 어떻게 했나요?", "typecheck로 코드 오류를 확인하고 Expo export로 산출물을 만든 뒤, 발표 자료와 WBS는 GitHub Pages에서 URL로 확인하게 했습니다."),
        ("Q5. 앞으로 어떻게 활용하나요?", "과제 많은 요일과 에너지 소모를 기록해 나중에는 주간 리포트와 SQLite 저장으로 확장할 계획입니다."),
    ]
    y = 390
    for q, a in qa:
        c.setFont(FONT_BOLD, 13)
        c.setFillColor(BLUE)
        c.drawString(64, y, q)
        y = draw_wrapped(c, a, 84, y - 22, 690, size=11, color=INK, leading=15, max_lines=3) - 10
    c.showPage()
    page += 1

    # 16. Closing
    w, h = landscape(A4)
    c.setFillColor(NAVY)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(CYAN)
    c.rect(0, h - 12, w, 12, fill=1, stroke=0)
    c.setFont(FONT_BOLD, 46)
    c.setFillColor(colors.white)
    c.drawCentredString(w / 2, 310, "감사합니다")
    c.setFont(FONT_BOLD, 30)
    c.setFillColor(CYAN)
    c.drawCentredString(w / 2, 260, "Q&A")
    rounded(c, 150, 120, 540, 72, 24, colors.HexColor("#111B2B"), colors.HexColor("#2A3950"), 1)
    draw_wrapped(
        c,
        "Energy Budget은 더 많이 하게 만드는 앱이 아니라, 오늘의 나를 기준으로 계획을 다시 세우게 돕는 앱입니다.",
        190,
        165,
        460,
        font=FONT_BOLD,
        size=16,
        color=colors.white,
        leading=24,
    )
    c.setFont(FONT_REGULAR, 10)
    c.setFillColor(colors.HexColor("#B8C6D8"))
    c.drawRightString(w - 42, 24, f"Energy Budget | {page}")
    c.save()


if __name__ == "__main__":
    build()
    print(PDF_PATH)
