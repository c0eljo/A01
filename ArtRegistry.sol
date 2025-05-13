// Arquivo: ArtRegistry.sol
pragma solidity ^0.8.0;

contract ArtRegistry {
    struct Art {
        address artist;
        string title;
        bool isExclusive;
        uint256 timestamp;
    }
    
    struct Share {
        address sharer;
        address originalArtist;
        string platform;
        uint256 timestamp;
    }
    
    mapping(bytes32 => Art) public arts;
    mapping(bytes32 => Share[]) public shares;
    
    event ArtRegistered(
        bytes32 indexed fileHash,
        address indexed artist,
        string title,
        bool isExclusive
    );
    
    event ArtShared(
        bytes32 indexed fileHash,
        address indexed originalArtist,
        address indexed sharer,
        string platform
    );
    
    function registerArt(
        bytes32 fileHash,
        string memory title,
        bool isExclusive
    ) public {
        require(arts[fileHash].artist == address(0), "Arte ja registrada");
        
        arts[fileHash] = Art({
            artist: msg.sender,
            title: title,
            isExclusive: isExclusive,
            timestamp: block.timestamp
        });
        
        emit ArtRegistered(fileHash, msg.sender, title, isExclusive);
    }
    
    function registerShare(
        bytes32 fileHash,
        address originalArtist,
        string memory platform
    ) public {
        require(arts[fileHash].artist != address(0), "Arte nao registrada");
        require(arts[fileHash].artist == originalArtist, "Artista original incorreto");
        
        shares[fileHash].push(Share({
            sharer: msg.sender,
            originalArtist: originalArtist,
            platform: platform,
            timestamp: block.timestamp
        }));
        
        emit ArtShared(fileHash, originalArtist, msg.sender, platform);
    }
    
    function getArtInfo(bytes32 fileHash) public view returns (
        address artist,
        string memory title,
        bool isExclusive,
        uint256 timestamp
    ) {
        Art memory art = arts[fileHash];
        return (art.artist, art.title, art.isExclusive, art.timestamp);
    }
    
    function getShareCount(bytes32 fileHash) public view returns (uint) {
        return shares[fileHash].length;
    }
}