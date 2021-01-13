export enum IpMode{
    Unknown = 0,
    IPv4 = (1 << 0),
    IPv6 = (1 << 1),
    Both = IPv4 | IPv6
}

export enum OperatingModes{
    Unknown = 0,
            None = 1,
            Appointment = 2,
            Presenting = 3
}

export enum TcpTestResult {
    Failed = 0,
    Connected = 1 << 0,
    CallbackAttempted = 1 << 1,
    CallbackSucceeded = 1 << 2,
}