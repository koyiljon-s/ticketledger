// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * StageTicket — reference smart contract for the StageChain demo.
 *
 * This is what lib/chain/contract.ts would look like on Ethereum (or any EVM
 * chain such as Polygon). Each ticket is an ERC-721-style NFT. The rules
 * enforced in the demo map one-to-one to the `require` statements below.
 *
 * Educational code: NOT audited, do not deploy with real funds.
 * A production version would inherit OpenZeppelin's ERC721 + ReentrancyGuard.
 */
contract StageTicket {
    struct ShowEvent {
        address organizer;
        string name;
        uint256 price;        // face value in wei
        uint32 supply;
        uint32 sold;
        uint16 royaltyBps;    // e.g. 1000 = 10% royalty on each resale
        uint16 maxMarkupBps;  // e.g. 1000 = resale price may be at most +10%
    }

    struct Ticket {
        uint256 eventId;
        address owner;
        bool used;
        uint256 listPrice;    // 0 = not listed
    }

    address public immutable admin;
    mapping(address => bool) public verifiedOrganizer;

    uint256 public eventCount;
    uint256 public ticketCount;
    mapping(uint256 => ShowEvent) public events;
    mapping(uint256 => Ticket) public tickets;

    event EventCreated(uint256 indexed eventId, address indexed organizer, string name);
    event TicketMinted(uint256 indexed ticketId, uint256 indexed eventId, address indexed buyer);
    event TicketListed(uint256 indexed ticketId, uint256 price);
    event TicketResold(uint256 indexed ticketId, address from, address to, uint256 price, uint256 royalty);
    event TicketTransferred(uint256 indexed ticketId, address from, address to);
    event CheckedIn(uint256 indexed ticketId, address holder);

    constructor() {
        admin = msg.sender;
        verifiedOrganizer[msg.sender] = true;
    }

    function verifyOrganizer(address who) external {
        require(msg.sender == admin, "Only admin");
        verifiedOrganizer[who] = true;
    }

    // ── Organizer ─────────────────────────────────────────────────────────

    function createEvent(
        string calldata name,
        uint256 price,
        uint32 supply,
        uint16 royaltyBps,
        uint16 maxMarkupBps
    ) external returns (uint256 id) {
        require(verifiedOrganizer[msg.sender], "Only a verified organizer can create events");
        require(price > 0, "Price must be positive");
        require(supply > 0 && supply <= 500, "Supply must be 1-500");
        require(royaltyBps <= 2500, "Royalty must be 0-25%");
        require(maxMarkupBps <= 10000, "Max markup must be 0-100%");

        id = ++eventCount;
        events[id] = ShowEvent(msg.sender, name, price, supply, 0, royaltyBps, maxMarkupBps);
        emit EventCreated(id, msg.sender, name);
    }

    function checkIn(uint256 ticketId) external {
        Ticket storage t = tickets[ticketId];
        require(t.owner != address(0), "Ticket does not exist - possibly counterfeit");
        require(msg.sender == events[t.eventId].organizer, "Only the event organizer can check tickets in");
        require(!t.used, "Ticket was already used - entry denied");
        t.used = true;
        t.listPrice = 0;
        emit CheckedIn(ticketId, t.owner);
    }

    // ── Primary sale ──────────────────────────────────────────────────────

    function buyTicket(uint256 eventId) external payable returns (uint256 ticketId) {
        ShowEvent storage e = events[eventId];
        require(e.organizer != address(0), "Event does not exist");
        require(e.sold < e.supply, "Sold out");
        require(msg.value == e.price, "Send exact face value");

        e.sold++;
        ticketId = ++ticketCount;
        tickets[ticketId] = Ticket(eventId, msg.sender, false, 0);

        _pay(e.organizer, msg.value);
        emit TicketMinted(ticketId, eventId, msg.sender);
    }

    // ── Secondary market ──────────────────────────────────────────────────

    function maxResalePrice(uint256 eventId) public view returns (uint256) {
        ShowEvent storage e = events[eventId];
        return (e.price * (10000 + e.maxMarkupBps)) / 10000;
    }

    function listTicket(uint256 ticketId, uint256 price) external {
        Ticket storage t = tickets[ticketId];
        require(t.owner == msg.sender, "Only the ticket owner can list it");
        require(!t.used, "Ticket has already been used");
        require(price > 0, "Price must be positive");
        require(price <= maxResalePrice(t.eventId), "Anti-scalping rule: price exceeds cap");
        t.listPrice = price;
        emit TicketListed(ticketId, price);
    }

    function cancelListing(uint256 ticketId) external {
        Ticket storage t = tickets[ticketId];
        require(t.owner == msg.sender, "Only the ticket owner can cancel the listing");
        require(t.listPrice > 0, "Ticket is not listed");
        t.listPrice = 0;
    }

    function buyResale(uint256 ticketId) external payable {
        Ticket storage t = tickets[ticketId];
        require(t.listPrice > 0, "Ticket is not for sale");
        require(t.owner != msg.sender, "You already own this ticket");
        require(!t.used, "Ticket has already been used");
        require(msg.value == t.listPrice, "Send exact listing price");

        ShowEvent storage e = events[t.eventId];
        uint256 royalty = (msg.value * e.royaltyBps) / 10000;
        address seller = t.owner;

        // Effects before interactions (checks-effects-interactions pattern).
        t.owner = msg.sender;
        t.listPrice = 0;

        _pay(seller, msg.value - royalty);
        _pay(e.organizer, royalty);
        emit TicketResold(ticketId, seller, msg.sender, msg.value, royalty);
    }

    function transfer(uint256 ticketId, address to) external {
        Ticket storage t = tickets[ticketId];
        require(t.owner == msg.sender, "Only the ticket owner can transfer it");
        require(!t.used, "Ticket has already been used");
        require(to != msg.sender && to != address(0), "Invalid recipient");
        t.owner = to;
        t.listPrice = 0;
        emit TicketTransferred(ticketId, msg.sender, to);
    }

    function _pay(address to, uint256 amount) private {
        if (amount == 0) return;
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "Payment failed");
    }
}
