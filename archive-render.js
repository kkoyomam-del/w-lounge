(function () {
  const EXTRA_QUOTES = ["기타(미분류)", "짧은 응답·일상(신설)", "건강·대체의학(신설)", "운영·안내(신설)", "(blank)"];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function sourceLine(item) {
    return [item.date, item.source, item.status === "공개" ? "" : item.status, item.cafe ? "카페 " + item.cafe : ""]
      .filter(Boolean)
      .join(" · ");
  }

  function groupLabel(item, mode) {
    if (mode === "menu") return item.menu || "\u2014";
    if (mode === "smart") {
      return item.category && item.category !== "\u2014" ? item.category : (item.menu || "\u2014");
    }
    return item.category || "\u2014";
  }

  function countByGroup(items, mode) {
    return items.reduce(function (acc, item) {
      const value = groupLabel(item, mode);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  function createCard(item) {
    const card = el("article", "wl-card");
    const meta = el("div", "wl-card-meta", sourceLine(item));
    const title = el("div", "wl-card-title", item.title);
    const text = el("div", "wl-card-text");
    text.textContent = item.text;
    card.append(meta, title, text);
    return card;
  }

  function renderList(host, items, options) {
    host.innerHTML = "";

    if (!items.length) {
      host.appendChild(el("div", "wl-empty", "해당 원문이 없습니다."));
      return;
    }

    const byCat = items.reduce(function (acc, item) {
      const cat = groupLabel(item, options.groupMode);
      (acc[cat] ||= []).push(item);
      return acc;
    }, {});

    Object.keys(byCat).sort(function (a, b) {
      return a.localeCompare(b, "ko");
    }).forEach(function (category, index) {
      const group = document.createElement("details");
      group.className = "wl-group";
      group.open = index === 0 || options.forceOpen;

      const summary = el("summary", "");
      summary.append(el("span", "wl-group-title", category), el("span", "wl-group-count", byCat[category].length + "건"));
      group.appendChild(summary);

      const cards = el("div", "wl-card-list");
      byCat[category].forEach(function (item) {
        cards.appendChild(createCard(item));
      });
      group.appendChild(cards);
      host.appendChild(group);
    });
  }

  function renderArchive(section) {
    const menus = (section.dataset.wlMenus || "").split("|").map(function (value) {
      return value.trim();
    }).filter(Boolean);
    const title = section.dataset.wlTitle || "원문 아카이브";
    const subtitle = section.dataset.wlSubtitle || "분류와 날짜 기준으로 정리한 고문님 원문입니다.";
    const groupMode = section.dataset.wlGroup || "category";
    const all = Array.isArray(window.WL_ARCHIVE) ? window.WL_ARCHIVE : [];
    const items = all.filter(function (item) {
      return menus.includes(item.menu);
    }).sort(function (a, b) {
      return (a.dateSort + String(a.no).padStart(6, "0")).localeCompare(b.dateSort + String(b.no).padStart(6, "0"));
    });

    const head = el("div", "wl-archive-head");
    const eyebrow = el("div", "wl-archive-eyebrow", "전체 원문 " + items.length.toLocaleString("ko-KR") + "건");
    const h = el("h3", "wl-archive-title", title);
    const p = el("p", "wl-archive-subtitle", subtitle);
    head.append(eyebrow, h, p);

    const controls = el("div", "wl-archive-controls");
    const search = document.createElement("input");
    search.className = "wl-archive-search";
    search.type = "search";
    search.placeholder = "원문 검색";
    controls.appendChild(search);

    const chips = el("div", "wl-chipbar");
    const categories = countByGroup(items, groupMode);
    const allChip = el("button", "wl-chip active", "전체 " + items.length);
    allChip.type = "button";
    allChip.dataset.value = "";
    chips.appendChild(allChip);
    Object.keys(categories).sort(function (a, b) { return a.localeCompare(b, "ko"); }).forEach(function (cat) {
      const chip = el("button", "wl-chip", cat + " " + categories[cat]);
      chip.type = "button";
      chip.dataset.value = cat;
      chips.appendChild(chip);
    });

    const list = el("div", "wl-archive-list");
    section.append(head, controls, chips, list);

    function currentCategory() {
      const active = chips.querySelector(".wl-chip.active");
      return active ? active.dataset.value : "";
    }

    function apply() {
      const term = search.value.trim().toLowerCase();
      const cat = currentCategory();
      const filtered = items.filter(function (item) {
        const catValue = groupLabel(item, groupMode);
        const inCat = !cat || catValue === cat;
        const haystack = [item.title, item.text, item.date, item.source, item.menu, item.category].join("\n").toLowerCase();
        return inCat && (!term || haystack.includes(term));
      });
      renderList(list, filtered, { groupMode: groupMode, forceOpen: Boolean(term || cat) });
    }

    search.addEventListener("input", apply);
    chips.addEventListener("click", function (event) {
      const btn = event.target.closest(".wl-chip");
      if (!btn) return;
      chips.querySelectorAll(".wl-chip").forEach(function (chip) { chip.classList.remove("active"); });
      btn.classList.add("active");
      apply();
    });

    apply();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".wl-archive[data-wl-menus]").forEach(renderArchive);
  });
})();
