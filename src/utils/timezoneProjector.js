function getTimezoneDateProjection(fieldName, timezone, alias = null) {
    return {
        [alias || fieldName]: {
            $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S",
                date: `$${fieldName}`,
                timezone: timezone || "UTC",
            }
        }
    };
}

export { getTimezoneDateProjection };
