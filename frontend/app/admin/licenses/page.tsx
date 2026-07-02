'use client'; // Componenta utilizează hook-uri client-side (stări React) pentru formulare modale

import { useEffect, useState } from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Button,
    Badge,
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
    Label,
    Input,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui';
import api from '@/lib/axios'; // Axios configurat pentru securitatea sesiunii administrative
import styles from './licenses.module.scss'; // Stilurile SCSS specifice licențelor

interface UserData {
    id: number;
    email: string;
    license?: {
        plan_type: string;
        credits_remaining: number;
        is_active: boolean;
    };
}

export default function LicensesPage() {
    // 1. STATE-URI PENTRU ADMINISTRARE LICENȚE UTILIZATORI
    const [users, setUsers] = useState<UserData[]>([]); // Lista de utilizatori care conține licențele lor
    const [loading, setLoading] = useState(true); // Indicator încărcare tabel
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null); // Utilizatorul selectat pentru editare licență
    
    // Stări locale pentru formularul de actualizare licență
    const [plan, setPlan] = useState("FREE"); // Planul selectat (FREE, PRO, ENTERPRISE)
    const [credits, setCredits] = useState(10); // Numărul de credite alocate
    const [isActive, setIsActive] = useState(true); // Statusul licenței (activă/inactivă)
    const [open, setOpen] = useState(false); // Starea de vizibilitate a modalului (open/closed)

    // Preia utilizatorii și detaliile de licență de la backend
    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users for licenses", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. EFECT DE INIȚIALIZARE DATE
    useEffect(() => {
        fetchUsers();
    }, []);

    // Deschide dialogul și completează câmpurile cu datele licenței curente ale utilizatorului selectat
    const handleEditClick = (user: UserData) => {
        setSelectedUser(user);
        setPlan(user.license?.plan_type || "FREE");
        setCredits(user.license?.credits_remaining || 0);
        setIsActive(user.license?.is_active ?? true);
        setOpen(true);
    };

    // 3. SALVARE DATE LICENȚĂ (Apelează `/admin/licenses/{userId}`)
    const handleSave = async () => {
        if (!selectedUser) return;

        try {
            await api.put(`/admin/licenses/${selectedUser.id}`, {
                plan_type: plan,
                credits_remaining: credits,
                is_active: isActive
            });
            setOpen(false); // Închide modalul
            fetchUsers(); // Reîncarcă lista de utilizatori pentru a afișa noile date actualizate
        } catch (error) {
            console.error("Failed to update license", error);
            alert("Actualizarea licenței a eșuat");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Se încarcă licențele...</div>;

    // Calculăm total credite emise în sistem și numărul de useri premium
    const totalCredits = users.reduce((acc, user) => acc + (user.license?.credits_remaining || 0), 0);
    const proUsers = users.filter(user => user.license?.plan_type === 'PRO' || user.license?.plan_type === 'ENTERPRISE').length;

    return (
        <div className={styles.pageWrapper}>
            {/* Antetul paginii cu statistici despre credite și planuri active */}
            <div className={styles.pageHeader}>
                <div className={styles.headerText}>
                    <h2 className={styles.title}>Gestiune Licențe</h2>
                    <p className={styles.subtitle}>Alocă planuri tarifare și gestionează creditele utilizatorilor.</p>
                </div>
                
                {/* Statistici Licențe */}
                <div className={styles.headerStats}>
                    <div className={styles.statCard}>
                        <div className={styles.purpleIconBox}>
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <div className={styles.statLabel}>Utilizatori Premium</div>
                            <div className={styles.statValue}>{proUsers}</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.yellowIconBox}>
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <div className={styles.statLabel}>Total Credite Emise</div>
                            <div className={styles.statValue}>{totalCredits}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabelul cu licențele utilizatorilor înregistrați */}
            <div className={styles.card}>
                <div className={styles.cardHeaderBlock}>
                    <h3 className={styles.cardTitle}>Licențe Utilizatori</h3>
                    <p className={styles.cardDesc}>Vizualizare și editare credite sau abonamente active.</p>
                </div>
                <div className={styles.tableWrapper}>
                    <Table>
                        <TableHeader>
                            <TableRow className={styles.tableHeadRow}>
                                <TableHead className={styles.tableHeadText}>Utilizator</TableHead>
                                <TableHead className={styles.tableHeadText}>Plan Curent</TableHead>
                                <TableHead className={styles.tableHeadText}>Credite rămase</TableHead>
                                <TableHead className={styles.tableHeadText}>Status Licență</TableHead>
                                <TableHead className="text-right text-slate-400">Acțiuni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className={styles.tableRow}>
                                    <TableCell className={styles.userCell}>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`border-slate-600 ${user.license?.plan_type === 'PRO' ? 'text-blue-400 border-blue-400' : 'text-slate-300'}`}>
                                            {user.license?.plan_type || 'FREE'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.license?.credits_remaining ?? 0}</TableCell>
                                    <TableCell>
                                        {/* Badge Status Licență */}
                                        <Badge variant={user.license?.is_active !== false ? "default" : "destructive"} className={user.license?.is_active !== false ? "bg-green-600 hover:bg-green-700" : ""}>
                                            {user.license?.is_active !== false ? 'Activ' : 'Inactiv'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={styles.actionsCell}>
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(user)} className={styles.editBtn}>
                                            Editează Licența
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* DIALOG DE EDITARE LICENȚĂ (Fereastra modală) */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Editează Licența</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Actualizează planul și creditele pentru {selectedUser?.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* 1. Selector Plan (FREE, PRO, ENTERPRISE) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan" className="text-right text-slate-300">
                                Plan
                            </Label>
                            <Select value={plan} onValueChange={setPlan}>
                                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-slate-100">
                                    <SelectValue placeholder="Selectează un plan" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                    <SelectItem value="FREE">Free</SelectItem>
                                    <SelectItem value="PRO">Pro</SelectItem>
                                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* 2. Credite Disponibile */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="credits" className="text-right text-slate-300">
                                Credite
                            </Label>
                            <Input
                                id="credits"
                                type="number"
                                value={credits}
                                onChange={(e) => setCredits(Number(e.target.value))}
                                className="col-span-3 bg-slate-800 border-slate-700 text-slate-100"
                            />
                        </div>
                        {/* 3. Status Licență */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="active" className="text-right text-slate-300">
                                Status
                            </Label>
                            <Select value={isActive ? "true" : "false"} onValueChange={(val) => setIsActive(val === "true")}>
                                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-slate-100">
                                    <SelectValue placeholder="Selectează status" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                    <SelectItem value="true">Activ</SelectItem>
                                    <SelectItem value="false">Inactiv</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Salvează modificările</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
