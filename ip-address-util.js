'use strict';

const ipaddrJs = require('ipaddr.js');

/**
 * Gets the first public IP address from the X-Forwarded-For header. Handles both IPv4 and IPv6.
 * X-Forwarded-For: <client>, <proxy1>, <proxy2>
 * @param xForwardedFor
 * @returns {string|undefined}
 */
function getFirstPublicAddressFromXForwardedFor(xForwardedFor) {
    const addressesInTheChain = xForwardedFor.split(',').map(address => address.trim());

    return addressesInTheChain.find(address => {
        const ipAddress = ipaddrJs.parse(address);

        // unicast is what is considered a public (non-reserved) address.
        return ipAddress.range() === 'unicast';
    });
}

module.exports = {
    getFirstPublicAddressFromXForwardedFor
};
