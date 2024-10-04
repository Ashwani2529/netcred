export function setAllValuesToNull(obj) {
    const result = {};
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = setAllValuesToNull(obj[key]); // Recursively call the function for nested objects
      } else {
        result[key] = null;
      }
    }
    return result;
}

export function generatePageButtons(filteredGroups, itemsPerPage, currentPage) {
    const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
    const maxPages = 4;
    let pageButtons = [];

    let startPage = Math.max(currentPage - Math.floor(maxPages / 2), 1);
    let endPage = Math.min(startPage + maxPages - 1, totalPages);

    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(endPage - maxPages + 1, 1);
    }

    if (startPage > 1) {
        pageButtons.push({ page: 1 });
        if (startPage > 2) {
            pageButtons.push({ separator: true });
        }
    }

    for (let page = startPage; page <= endPage; page++) {
        pageButtons.push({ page });
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageButtons.push({ separator: true });
        }
        pageButtons.push({ page: totalPages });
    }

    return pageButtons;
}

export function generateCSV(data, name) {
    const csv = data.map(function(d){ return JSON.stringify(d);}).join('\n').replace(/(^\[)|(\]$)/mg, '');    
    const csvFile = new Blob([csv], {type: 'text/csv'});  
    const downloadLink = document.createElement("a");  
    downloadLink.download = name + '.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile);  
    downloadLink.style.display = "none";  

    document.body.appendChild(downloadLink);  
    downloadLink.click(); 
}

export function currencytoSymbol(currency) {
    switch (currency) {
        case 'USD':
            return '$';
        case 'EUR':
            return '€';
        case 'GBP':
            return '£';
        case 'INR':
            return '₹';
    }
}

// Generate two-letter initials from the organization name
export function generateInitials(name) {
    return name
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

// TODO: Change this back to true for httpOnly and secure
export const setAuthToken = ({cookies, token}) => {
    cookies.set('AuthorizationToken', `Bearer ${token}`, {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/'
    });
};