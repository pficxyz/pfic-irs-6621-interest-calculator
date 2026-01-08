/**
 * PFIC 1291 Excess Distribution Interest Calculator
 * Logic: IRC §6601(a), §6621, §7503
 * Date Logic: (Start Date, End Date] - Interest starts the day AFTER the due date.
 */

const IRS_RATES = {
    2025: [0.07, 0.07, 0.07, 0.07],
    2024: [0.08, 0.08, 0.08, 0.08],
    2023: [0.07, 0.07, 0.07, 0.08],
    2022: [0.03, 0.04, 0.05, 0.06],
    2021: [0.03, 0.03, 0.03, 0.03],
    2020: [0.05, 0.05, 0.03, 0.03],
    2019: [0.06, 0.06, 0.05, 0.05],
    2018: [0.04, 0.05, 0.05, 0.05],
    2017: [0.04, 0.04, 0.04, 0.04],
    2016: [0.03, 0.04, 0.04, 0.04],
    2015: [0.03, 0.03, 0.03, 0.03],
    2014: [0.03, 0.03, 0.03, 0.03],
    2013: [0.03, 0.03, 0.03, 0.03],
    2012: [0.03, 0.03, 0.03, 0.03],
    2011: [0.03, 0.04, 0.04, 0.03],
    2010: [0.04, 0.04, 0.04, 0.04],
    2009: [0.05, 0.04, 0.04, 0.04],
    2008: [0.07, 0.06, 0.05, 0.06],
    2007: [0.08, 0.08, 0.08, 0.08],
    2006: [0.07, 0.07, 0.08, 0.08],
    2005: [0.05, 0.06, 0.06, 0.07],
    2004: [0.04, 0.05, 0.04, 0.05],
    2003: [0.05, 0.05, 0.05, 0.04],
    2002: [0.06, 0.06, 0.06, 0.06],
    2001: [0.09, 0.08, 0.07, 0.07],
    2000: [0.08, 0.09, 0.09, 0.09],
    1999: [0.07, 0.08, 0.08, 0.08],
    1998: [0.09, 0.08, 0.08, 0.08],
    1997: [0.09, 0.09, 0.09, 0.09],
    1996: [0.09, 0.08, 0.09, 0.09],
    1995: [0.09, 0.10, 0.09, 0.09],
    1994: [0.07, 0.07, 0.08, 0.09],
    1993: [0.07, 0.07, 0.07, 0.07],
    1992: [0.09, 0.08, 0.08, 0.07],
    1991: [0.11, 0.10, 0.10, 0.10],
    1990: [0.11, 0.11, 0.11, 0.11],
    1989: [0.11, 0.12, 0.12, 0.11],
    1988: [0.11, 0.10, 0.10, 0.11],
    1987: [0.09, 0.09, 0.09, 0.10]
};

const DUE_DATE_MAP = {
    1987: "1988-04-18", 1988: "1989-04-18", 1989: "1990-04-17", 1990: "1991-04-15",
    1991: "1992-04-15", 1992: "1993-04-15", 1993: "1994-04-18", 1994: "1995-04-18",
    1995: "1996-04-15", 1996: "1997-04-15", 1997: "1998-04-15", 1998: "1999-04-15",
    1999: "2000-04-18", 2000: "2001-04-17", 2001: "2002-04-15", 2002: "2003-04-15",
    2003: "2004-04-15", 2004: "2005-04-18", 2005: "2006-04-18", 2006: "2007-04-17",
    2007: "2008-04-15", 2008: "2009-04-15", 2009: "2010-04-15", 2010: "2011-04-18",
    2011: "2012-04-17", 2012: "2013-04-15", 2013: "2014-04-15", 2014: "2015-04-15",
    2015: "2016-04-18", 2016: "2017-04-18", 2017: "2018-04-17", 2018: "2019-04-15",
    2019: "2020-07-15", 2020: "2021-05-17", 2021: "2022-04-18", 2022: "2023-04-18",
    2023: "2024-04-15", 2024: "2025-04-15"
};

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getRateForDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3);
    if (IRS_RATES[year]) {
        return IRS_RATES[year][quarter];
    }
    return 0.07;
}

/**
 * Parses YYYY-MM-DD string into a local Date object (midnight).
 */
function parseLocalDate(s) {
    const parts = s.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

document.addEventListener('DOMContentLoaded', () => {
    const taxableYearSelect = document.getElementById('taxableYear');
    const filingYearSelect = document.getElementById('filingYear');
    const principalInput = document.getElementById('principal');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // Populate Allocated Year (1987 to 2024)
    for (let y = 2024; y >= 1987; y--) {
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        taxableYearSelect.appendChild(opt);
    }

    function updateFilingYears() {
        const selectedAllocYear = parseInt(taxableYearSelect.value);
        const previousFilingYear = filingYearSelect.value;

        filingYearSelect.innerHTML = '';
        // Filing Year must be GREATER than Allocated Year
        // We go up to 2024 since that's the latest return year we have rates/dates for
        for (let y = 2024; y > selectedAllocYear; y--) {
            const opt = document.createElement('option');
            opt.value = y; opt.textContent = y;
            filingYearSelect.appendChild(opt);
        }

        // Try to preserve selection if it's still valid, otherwise pick the latest available
        if (previousFilingYear && parseInt(previousFilingYear) > selectedAllocYear) {
            filingYearSelect.value = previousFilingYear;
        } else if (filingYearSelect.options.length > 0) {
            filingYearSelect.value = filingYearSelect.options[0].value;
        }

        updateEndDate();
    }

    function updateEndDate() {
        const year = filingYearSelect.value;
        if (year && DUE_DATE_MAP[year]) {
            endDateInput.value = DUE_DATE_MAP[year];
        } else if (year) {
            // Predictable fallback if map is missing a future year
            const nextYear = parseInt(year) + 1;
            endDateInput.value = `${nextYear}-04-15`;
        }
    }

    taxableYearSelect.addEventListener('change', () => {
        const year = taxableYearSelect.value;
        if (DUE_DATE_MAP[year]) {
            startDateInput.value = DUE_DATE_MAP[year];
        }
        updateFilingYears();
        performCalculation(true);
    });

    filingYearSelect.addEventListener('change', () => {
        updateEndDate();
        performCalculation(true);
    });

    // Auto-calculate when tax or dates change
    principalInput.addEventListener('input', () => performCalculation(true));
    startDateInput.addEventListener('change', () => performCalculation(true));
    endDateInput.addEventListener('change', () => performCalculation(true));

    // Set Initial Defaults
    taxableYearSelect.value = "2023";
    // Manually set initial startDate instead of hardcoding
    if (DUE_DATE_MAP["2023"]) {
        startDateInput.value = DUE_DATE_MAP["2023"];
    }

    updateFilingYears(); // This populates filingYearSelect and triggers updateEndDate()

    performCalculation(true);

    // Render Historical Rates Table
    renderRatesTable();
});

function renderRatesTable() {
    const tbody = document.querySelector('#ratesTable tbody');
    if (!tbody) return;

    // Sort years descending
    const years = Object.keys(IRS_RATES).sort((a, b) => b - a);

    years.forEach(year => {
        const rates = IRS_RATES[year];
        const row = tbody.insertRow();
        row.innerHTML = `
            <td style="font-weight:600; color:#1e293b;">${year}</td>
            <td>${(rates[0] * 100).toFixed(0)}%</td>
            <td>${(rates[1] * 100).toFixed(0)}%</td>
            <td>${(rates[2] * 100).toFixed(0)}%</td>
            <td>${(rates[3] * 100).toFixed(0)}%</td>
        `;
    });
}

function performCalculation(isSilent = false) {
    const principalInput = parseFloat(document.getElementById('principal').value);
    const startDateRaw = document.getElementById('startDate').value;
    const endDateRaw = document.getElementById('endDate').value;

    if (isNaN(principalInput) || !startDateRaw || !endDateRaw) {
        if (!isSilent) alert('Please enter a valid amount and dates.');
        return;
    }

    // Logic: [Start Date, End Date)
    // Start Date is the Statutory Due Date (Included in interest).
    // Final End Date is the Statutory Due Date of the filing year (Excluded).
    // Logic: (Start Date, End Date] -> Exclude Start, Include End
    // Implemented by shifting both dates forward by 1 day and using [Start, End) logic.
    // [Start+1, End+1) is mathematically equivalent to (Start, End].
    const startObj = parseLocalDate(startDateRaw);
    startObj.setDate(startObj.getDate() + 1);

    const endObj = parseLocalDate(endDateRaw);
    endObj.setDate(endObj.getDate() + 1);

    // Interest starts ON the statutory due date.
    let currentPtr = new Date(startObj);

    // Interest ends ON the statutory due date of the filing year.
    // In day count terms [Start, End), we stop at standard day subtraction.
    const finalBoundary = new Date(endObj);

    if (currentPtr >= finalBoundary) {
        if (!isSilent) alert('End Date must be after Start Date.');
        return;
    }

    const segments = [];
    let currentBalance = principalInput;
    let totalInterest = 0;

    while (currentPtr < finalBoundary) {
        // Quarter boundary is the start of Month 1 of next quarter (Jan, Apr, Jul, Oct)
        let nextQuarterBoundary = new Date(currentPtr.getFullYear(), Math.floor(currentPtr.getMonth() / 3) * 3 + 3, 1);
        let segmentEnd = new Date(Math.min(nextQuarterBoundary, finalBoundary));

        const diffMs = segmentEnd.getTime() - currentPtr.getTime();
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (days <= 0) break;

        const rate = getRateForDate(currentPtr);
        const daysInYear = isLeapYear(currentPtr.getFullYear()) ? 366 : 365;

        // Compound Interest for the segment
        const factor = Math.pow(1 + rate / daysInYear, days);
        const newBalance = currentBalance * factor;
        const interestEarned = newBalance - currentBalance;

        // Display Formatting:
        // If segment is 4/18/2012 to 7/1/2012, show "4/18/2012 - 6/30/2012"
        let displayEnd = new Date(segmentEnd);
        displayEnd.setDate(displayEnd.getDate() - 1);

        segments.push({
            start: new Date(currentPtr),
            end: displayEnd,
            rate: (rate * 100).toFixed(0) + '%',
            days: days,
            interest: interestEarned,
            balance: newBalance
        });

        totalInterest += interestEarned;
        currentBalance = newBalance;
        currentPtr = new Date(segmentEnd);
    }

    document.getElementById('resultsArea').classList.remove('hidden');
    document.getElementById('totalInterest').innerText = '$' + totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('totalDue').innerText = '$' + currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Calculate Interest Factor: (Total Interest / Original Principal)
    const factor = totalInterest / principalInput;
    document.getElementById('interestFactor').value = factor.toFixed(6);

    const tbody = document.querySelector('#detailsTable tbody');
    tbody.innerHTML = '';
    segments.forEach(seg => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${seg.start.toLocaleDateString('en-US')} - ${seg.end.toLocaleDateString('en-US')}</td>
            <td>${seg.rate}</td>
            <td>${seg.days}</td>
            <td style="color: #2563eb;">+${seg.interest.toFixed(2)}</td>
            <td>${seg.balance.toFixed(2)}</td>
        `;
    });
}
